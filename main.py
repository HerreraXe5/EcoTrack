from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from datetime import datetime, timedelta
import bcrypt
import jwt
from typing import Optional, List

DATABASE_URL = "sqlite:///./ecotrack_v2.db"
SECRET_KEY = "tu-secreto-super-seguro-cambiar-en-produccion-importante"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI(title="EcoTrack API con JWT", version="2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ============= MODELOS DE BD =============
class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String)
    telefono = Column(String, nullable=True)
    rol = Column(String, default="usuario")
    created_at = Column(DateTime, default=datetime.utcnow)

class Categoria(Base):
    __tablename__ = "categorias"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    factor_co2 = Column(Float)
    descripcion = Column(String, nullable=True)

class Registro(Base):
    __tablename__ = "registros"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, index=True)
    categoria_id = Column(Integer, index=True)
    peso_kg = Column(Float)
    co2_ahorrado = Column(Float)
    fecha_registro = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

# ============= SCHEMAS =============
class UsuarioBase(BaseModel):
    nombre: str
    email: str
    telefono: Optional[str] = None

class UsuarioCreate(UsuarioBase):
    password: str

class UsuarioResponse(BaseModel):
    id: int
    nombre: str
    email: str
    telefono: Optional[str] = None
    rol: str
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    email: str
    password: str

class LoginResponse(BaseModel):
    access_token: str
    token_type: str
    user: UsuarioResponse

class TokenData(BaseModel):
    email: Optional[str] = None
    user_id: Optional[int] = None
    rol: Optional[str] = None

class CategoriaBase(BaseModel):
    nombre: str
    factor_co2: float
    descripcion: Optional[str] = None

class CategoriaResponse(BaseModel):
    id: int
    nombre: str
    factor_co2: float
    descripcion: Optional[str] = None
    class Config:
        from_attributes = True

class RegistroCreate(BaseModel):
    usuario_id: int
    categoria_id: int
    peso_kg: float

class RegistroResponse(BaseModel):
    id: int
    usuario_id: int
    categoria_id: int
    peso_kg: float
    co2_ahorrado: float
    fecha_registro: datetime
    class Config:
        from_attributes = True

# ============= FUNCIONES DE SEGURIDAD =============
def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password: str, password_hash: str) -> bool:
    return bcrypt.checkpw(password.encode(), password_hash.encode())

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = None, db: Session = Depends(get_db)) -> dict:
    if not token:
        raise HTTPException(status_code=401, detail="Token no proporcionado")
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        email: str = payload.get("email")
        user_id: int = payload.get("user_id")
        if email is None or user_id is None:
            raise HTTPException(status_code=401, detail="Token inválido")
        token_data = TokenData(email=email, user_id=user_id, rol=payload.get("rol"))
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
    if usuario is None:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return {"user": usuario, "token_data": token_data}

# ============= ENDPOINTS PÚBLICOS =============

@app.post("/registro")
def registrar_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    db_usuario = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if db_usuario:
        raise HTTPException(status_code=409, detail="Email ya registrado")
    password_hash = hash_password(usuario.password)
    total_usuarios = db.query(Usuario).count()
    rol_asignado = "admin" if total_usuarios == 0 else "usuario"
    nuevo_usuario = Usuario(
        nombre=usuario.nombre,
        email=usuario.email,
        password_hash=password_hash,
        telefono=usuario.telefono,
        rol=rol_asignado
    )
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return {
        "id": nuevo_usuario.id,
        "nombre": nuevo_usuario.nombre,
        "email": nuevo_usuario.email,
        "rol": nuevo_usuario.rol,
        "message": f"Usuario registrado exitosamente como {rol_asignado}"
    }

@app.post("/login", response_model=LoginResponse)
def login(credenciales: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == credenciales.email).first()
    if not usuario or not verify_password(credenciales.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    access_token = create_access_token(
        data={"user_id": usuario.id, "email": usuario.email, "rol": usuario.rol},
        expires_delta=timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    )
    return LoginResponse(
        access_token=access_token,
        token_type="bearer",
        user=UsuarioResponse(
            id=usuario.id,
            nombre=usuario.nombre,
            email=usuario.email,
            telefono=usuario.telefono,
            rol=usuario.rol
        )
    )

@app.get("/usuarios/")
def listar_usuarios(db: Session = Depends(get_db)):
    usuarios = db.query(Usuario).all()
    return [{"id": u.id, "nombre": u.nombre, "email": u.email, "rol": u.rol} for u in usuarios]

# ============= ENDPOINTS PROTEGIDOS - USUARIOS =============

@app.put("/usuarios/{usuario_id}")
def actualizar_usuario(usuario_id: int, usuario_update: UsuarioBase, token: str = None, db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    current = get_current_user(token, db)
    if current["user"].id != usuario_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar esta cuenta")
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    usuario.nombre = usuario_update.nombre
    usuario.email = usuario_update.email
    usuario.telefono = usuario_update.telefono
    db.commit()
    db.refresh(usuario)
    return {"id": usuario.id, "nombre": usuario.nombre, "email": usuario.email, "telefono": usuario.telefono, "rol": usuario.rol}

@app.delete("/usuarios/{usuario_id}")
def eliminar_usuario(usuario_id: int, token: str = None, db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    current = get_current_user(token, db)
    if current["user"].id != usuario_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar esta cuenta")
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    db.query(Registro).filter(Registro.usuario_id == usuario_id).delete()
    db.delete(usuario)
    db.commit()
    return {"message": "Cuenta eliminada exitosamente"}

# ============= ENDPOINTS PROTEGIDOS - REGISTROS =============

@app.get("/registros/")
def obtener_registros(token: str = None, db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    current = get_current_user(token, db)
    registros = db.query(Registro).filter(Registro.usuario_id == current["user"].id).all()
    return [
        {
            "id": r.id,
            "usuario_id": r.usuario_id,
            "categoria_id": r.categoria_id,
            "peso_kg": r.peso_kg,
            "co2_ahorrado": r.co2_ahorrado,
            "fecha_registro": r.fecha_registro
        }
        for r in registros
    ]

@app.post("/registros/")
def crear_registro(registro: RegistroCreate, token: str = None, db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    current = get_current_user(token, db)
    if current["user"].id != registro.usuario_id:
        raise HTTPException(status_code=403, detail="No puedes crear registros para otro usuario")
    categoria = db.query(Categoria).filter(Categoria.id == registro.categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    co2_ahorrado = registro.peso_kg * categoria.factor_co2
    nuevo_registro = Registro(
        usuario_id=registro.usuario_id,
        categoria_id=registro.categoria_id,
        peso_kg=registro.peso_kg,
        co2_ahorrado=co2_ahorrado
    )
    db.add(nuevo_registro)
    db.commit()
    db.refresh(nuevo_registro)
    return {
        "id": nuevo_registro.id,
        "usuario_id": nuevo_registro.usuario_id,
        "categoria_id": nuevo_registro.categoria_id,
        "peso_kg": nuevo_registro.peso_kg,
        "co2_ahorrado": nuevo_registro.co2_ahorrado,
        "fecha_registro": nuevo_registro.fecha_registro
    }

@app.delete("/registros/{registro_id}")
def eliminar_registro(registro_id: int, token: str = None, db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    current = get_current_user(token, db)
    registro = db.query(Registro).filter(Registro.id == registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    if registro.usuario_id != current["user"].id:
        raise HTTPException(status_code=403, detail="No puedes eliminar registros de otro usuario")
    db.delete(registro)
    db.commit()
    return {"message": "Registro eliminado exitosamente"}

# ============= CATEGORÍAS =============

@app.get("/categorias/")
def obtener_categorias(db: Session = Depends(get_db)):
    """Obtener todas las categorías - PÚBLICO"""
    try:
        categorias = db.query(Categoria).all()
        return [
            {
                "id": c.id,
                "nombre": c.nombre,
                "factor_co2": c.factor_co2,
                "descripcion": c.descripcion
            }
            for c in categorias
        ]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al obtener categorías: {str(e)}")

@app.post("/categorias/")
def crear_categoria(categoria: CategoriaBase, token: str = None, db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    current = get_current_user(token, db)
    if current["user"].rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear categorías")
    nueva_categoria = Categoria(
        nombre=categoria.nombre,
        factor_co2=float(str(categoria.factor_co2).replace(',', '.')),
        descripcion=categoria.descripcion
    )
    db.add(nueva_categoria)
    db.commit()
    db.refresh(nueva_categoria)
    return {
        "id": nueva_categoria.id,
        "nombre": nueva_categoria.nombre,
        "factor_co2": nueva_categoria.factor_co2,
        "descripcion": nueva_categoria.descripcion
    }

@app.put("/categorias/{categoria_id}")
def actualizar_categoria(categoria_id: int, categoria_update: CategoriaBase, token: str = None, db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    current = get_current_user(token, db)
    if current["user"].rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden editar categorías")
    categoria = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    categoria.nombre = categoria_update.nombre
    categoria.factor_co2 = float(str(categoria_update.factor_co2).replace(',', '.'))
    categoria.descripcion = categoria_update.descripcion
    db.commit()
    db.refresh(categoria)
    return {
        "id": categoria.id,
        "nombre": categoria.nombre,
        "factor_co2": categoria.factor_co2,
        "descripcion": categoria.descripcion
    }

@app.get("/")
def health():
    return {"status": "online", "version": "2.0 with JWT", "docs": "/docs"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)