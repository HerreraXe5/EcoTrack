from fastapi import FastAPI, Depends, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime, text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel
from datetime import datetime, timedelta
import bcrypt
import jwt
from typing import Optional

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

# ============= MODELOS =============
class Usuario(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    password_hash = Column(String, nullable=True)
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

# Crear tablas si no existen
Base.metadata.create_all(bind=engine)

# ============= MIGRACIÓN AUTOMÁTICA =============
def migrar_bd():
    """Agregar columnas que faltan sin borrar datos existentes"""
    with engine.connect() as conn:
        # Verificar y agregar password_hash si no existe
        try:
            conn.execute(text("ALTER TABLE usuarios ADD COLUMN password_hash VARCHAR"))
            conn.commit()
            print("✅ Columna password_hash agregada")
        except Exception:
            pass  # Ya existe, no hace nada

        # Verificar y agregar rol si no existe
        try:
            conn.execute(text("ALTER TABLE usuarios ADD COLUMN rol VARCHAR DEFAULT 'usuario'"))
            conn.commit()
            print("✅ Columna rol agregada")
        except Exception:
            pass  # Ya existe

        # Verificar y agregar telefono si no existe
        try:
            conn.execute(text("ALTER TABLE usuarios ADD COLUMN telefono VARCHAR"))
            conn.commit()
            print("✅ Columna telefono agregada")
        except Exception:
            pass  # Ya existe

        # Actualizar usuarios existentes sin password_hash (asignar hash temporal)
        try:
            result = conn.execute(text("SELECT id, email FROM usuarios WHERE password_hash IS NULL"))
            usuarios_sin_hash = result.fetchall()
            for usuario in usuarios_sin_hash:
                hash_temp = bcrypt.hashpw("cambiar123".encode(), bcrypt.gensalt()).decode()
                conn.execute(
                    text("UPDATE usuarios SET password_hash = :hash WHERE id = :id"),
                    {"hash": hash_temp, "id": usuario[0]}
                )
                print(f"⚠️ Usuario {usuario[1]} actualizado con contraseña temporal: cambiar123")
            conn.commit()
        except Exception as e:
            print(f"Error actualizando usuarios: {e}")

        # Asignar rol admin al primer usuario si no tiene rol
        try:
            conn.execute(text("UPDATE usuarios SET rol = 'admin' WHERE id = (SELECT MIN(id) FROM usuarios) AND (rol IS NULL OR rol = '')"))
            conn.commit()
        except Exception:
            pass

# Ejecutar migración al iniciar
migrar_bd()

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

class RegistroCreate(BaseModel):
    usuario_id: int
    categoria_id: int
    peso_kg: float

# ============= FUNCIONES DE SEGURIDAD =============
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

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
        if not email or not user_id:
            raise HTTPException(status_code=401, detail="Token inválido")
        token_data = TokenData(email=email, user_id=user_id, rol=payload.get("rol"))
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")
    usuario = db.query(Usuario).filter(Usuario.id == user_id).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Usuario no encontrado")
    return {"user": usuario, "token_data": token_data}

# ============= ENDPOINTS =============

@app.get("/")
def health():
    return {"status": "online", "version": "2.0 with JWT"}

@app.post("/registro")
def registrar_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    db_usuario = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if db_usuario:
        raise HTTPException(status_code=409, detail="Email ya registrado")
    password_hash = hash_password(usuario.password)
    total_usuarios = db.query(Usuario).count()
    rol_asignado = "admin" if total_usuarios == 0 else "usuario"
    nuevo = Usuario(
        nombre=usuario.nombre,
        email=usuario.email,
        password_hash=password_hash,
        telefono=usuario.telefono,
        rol=rol_asignado
    )
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"id": nuevo.id, "nombre": nuevo.nombre, "email": nuevo.email, "rol": nuevo.rol, "message": f"Registrado como {rol_asignado}"}

@app.post("/login", response_model=LoginResponse)
def login(credenciales: LoginRequest, db: Session = Depends(get_db)):
    usuario = db.query(Usuario).filter(Usuario.email == credenciales.email).first()
    if not usuario:
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    if not usuario.password_hash:
        raise HTTPException(status_code=401, detail="Usuario sin contraseña configurada. Contáctate con el admin.")
    if not verify_password(credenciales.password, usuario.password_hash):
        raise HTTPException(status_code=401, detail="Email o contraseña incorrectos")
    token = create_access_token({"user_id": usuario.id, "email": usuario.email, "rol": usuario.rol or "usuario"})
    return LoginResponse(
        access_token=token,
        token_type="bearer",
        user=UsuarioResponse(id=usuario.id, nombre=usuario.nombre, email=usuario.email, telefono=usuario.telefono, rol=usuario.rol or "usuario")
    )

@app.get("/usuarios/")
def listar_usuarios(db: Session = Depends(get_db)):
    usuarios = db.query(Usuario).all()
    return [{"id": u.id, "nombre": u.nombre, "email": u.email, "rol": u.rol or "usuario"} for u in usuarios]

@app.put("/usuarios/{usuario_id}")
def actualizar_usuario(usuario_id: int, usuario_update: UsuarioBase, token: str = None, db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    current = get_current_user(token, db)
    if current["user"].id != usuario_id:
        raise HTTPException(status_code=403, detail="Sin permiso")
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
        raise HTTPException(status_code=403, detail="Sin permiso")
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="No encontrado")
    db.query(Registro).filter(Registro.usuario_id == usuario_id).delete()
    db.delete(usuario)
    db.commit()
    return {"message": "Cuenta eliminada"}

@app.get("/registros/")
def obtener_registros(token: str = None, db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    current = get_current_user(token, db)
    registros = db.query(Registro).filter(Registro.usuario_id == current["user"].id).all()
    return [{"id": r.id, "usuario_id": r.usuario_id, "categoria_id": r.categoria_id, "peso_kg": r.peso_kg, "co2_ahorrado": r.co2_ahorrado, "fecha_registro": r.fecha_registro} for r in registros]

@app.post("/registros/")
def crear_registro(registro: RegistroCreate, token: str = None, db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    current = get_current_user(token, db)
    if current["user"].id != registro.usuario_id:
        raise HTTPException(status_code=403, detail="Sin permiso")
    categoria = db.query(Categoria).filter(Categoria.id == registro.categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    co2 = registro.peso_kg * categoria.factor_co2
    nuevo = Registro(usuario_id=registro.usuario_id, categoria_id=registro.categoria_id, peso_kg=registro.peso_kg, co2_ahorrado=co2)
    db.add(nuevo)
    db.commit()
    db.refresh(nuevo)
    return {"id": nuevo.id, "usuario_id": nuevo.usuario_id, "categoria_id": nuevo.categoria_id, "peso_kg": nuevo.peso_kg, "co2_ahorrado": nuevo.co2_ahorrado, "fecha_registro": nuevo.fecha_registro}

@app.delete("/registros/{registro_id}")
def eliminar_registro(registro_id: int, token: str = None, db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    current = get_current_user(token, db)
    registro = db.query(Registro).filter(Registro.id == registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="No encontrado")
    if registro.usuario_id != current["user"].id:
        raise HTTPException(status_code=403, detail="Sin permiso")
    db.delete(registro)
    db.commit()
    return {"message": "Eliminado"}

@app.get("/categorias/")
def obtener_categorias(db: Session = Depends(get_db)):
    categorias = db.query(Categoria).all()
    return [{"id": c.id, "nombre": c.nombre, "factor_co2": c.factor_co2, "descripcion": c.descripcion} for c in categorias]

@app.post("/categorias/")
def crear_categoria(categoria: CategoriaBase, token: str = None, db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    current = get_current_user(token, db)
    if current["user"].rol != "admin":
        raise HTTPException(status_code=403, detail="Solo admin")
    nueva = Categoria(nombre=categoria.nombre, factor_co2=float(str(categoria.factor_co2).replace(',', '.')), descripcion=categoria.descripcion)
    db.add(nueva)
    db.commit()
    db.refresh(nueva)
    return {"id": nueva.id, "nombre": nueva.nombre, "factor_co2": nueva.factor_co2, "descripcion": nueva.descripcion}

@app.put("/categorias/{categoria_id}")
def actualizar_categoria(categoria_id: int, categoria_update: CategoriaBase, token: str = None, db: Session = Depends(get_db)):
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    current = get_current_user(token, db)
    if current["user"].rol != "admin":
        raise HTTPException(status_code=403, detail="Solo admin")
    categoria = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="No encontrada")
    categoria.nombre = categoria_update.nombre
    categoria.factor_co2 = float(str(categoria_update.factor_co2).replace(',', '.'))
    categoria.descripcion = categoria_update.descripcion
    db.commit()
    db.refresh(categoria)
    return {"id": categoria.id, "nombre": categoria.nombre, "factor_co2": categoria.factor_co2, "descripcion": categoria.descripcion}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)