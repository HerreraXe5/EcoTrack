from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, Integer, String, Float, DateTime
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from pydantic import BaseModel, EmailStr
from datetime import datetime, timedelta
import bcrypt
import jwt
import os
from typing import Optional

# ============= CONFIGURACIÓN =============
DATABASE_URL = "sqlite:///./ecotrack.db"
SECRET_KEY = "tu-secreto-super-seguro-cambiar-en-produccion-importante"
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_HOURS = 24

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

app = FastAPI(title="EcoTrack API con JWT", version="2.0")

# ============= CORS =============
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
    password_hash = Column(String)  # NUEVA: Hash de contraseña
    telefono = Column(String, nullable=True)
    rol = Column(String, default="usuario")  # "usuario" o "admin"
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

# ============= SCHEMAS (Pydantic) =============
class UsuarioBase(BaseModel):
    nombre: str
    email: str
    telefono: Optional[str] = None

class UsuarioCreate(UsuarioBase):
    password: str  # NUEVO: Contraseña en registro

class UsuarioResponse(UsuarioBase):
    id: int
    rol: str
    class Config:
        from_attributes = True

class LoginRequest(BaseModel):
    """Schema para login con usuario/contraseña"""
    email: str
    password: str

class LoginResponse(BaseModel):
    """Response con token JWT"""
    access_token: str
    token_type: str
    user: UsuarioResponse

class TokenData(BaseModel):
    """Datos extraídos del JWT"""
    email: Optional[str] = None
    user_id: Optional[int] = None
    rol: Optional[str] = None

class CategoriaBase(BaseModel):
    nombre: str
    factor_co2: float
    descripcion: Optional[str] = None

class CategoriaResponse(CategoriaBase):
    id: int
    class Config:
        from_attributes = True

class RegistroCreate(BaseModel):
    usuario_id: int
    categoria_id: int
    peso_kg: float

class RegistroResponse(RegistroCreate):
    id: int
    co2_ahorrado: float
    fecha_registro: datetime
    class Config:
        from_attributes = True

# ============= FUNCIONES DE SEGURIDAD =============

def hash_password(password: str) -> str:
    """Hashear contraseña con bcrypt"""
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode(), salt).decode()

def verify_password(password: str, password_hash: str) -> bool:
    """Verificar contraseña contra hash"""
    return bcrypt.checkpw(password.encode(), password_hash.encode())

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Crear JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

def get_db():
    """Dependencia de base de datos"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

def get_current_user(token: str = None, db: Session = Depends(get_db)) -> dict:
    """Validar JWT y obtener usuario actual"""
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

@app.post("/registro", response_model=dict)
def registrar_usuario(usuario: UsuarioCreate, db: Session = Depends(get_db)):
    """Registrar nuevo usuario con contraseña hasheada"""
    # Verificar si email ya existe
    db_usuario = db.query(Usuario).filter(Usuario.email == usuario.email).first()
    if db_usuario:
        raise HTTPException(status_code=409, detail="Email ya registrado")
    
    # Hashear contraseña
    password_hash = hash_password(usuario.password)
    
    # Crear usuario
    nuevo_usuario = Usuario(
        nombre=usuario.nombre,
        email=usuario.email,
        password_hash=password_hash,
        telefono=usuario.telefono,
        rol="usuario"  # Rol por defecto
    )
    
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    
    return {
        "id": nuevo_usuario.id,
        "nombre": nuevo_usuario.nombre,
        "email": nuevo_usuario.email,
        "rol": nuevo_usuario.rol,
        "message": "Usuario registrado exitosamente"
    }

@app.post("/login", response_model=LoginResponse)
def login(credenciales: LoginRequest, db: Session = Depends(get_db)):
    """Login con email y contraseña, devuelve JWT"""
    # Buscar usuario
    usuario = db.query(Usuario).filter(Usuario.email == credenciales.email).first()
    
    if not usuario or not verify_password(credenciales.password, usuario.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Email o contraseña incorrectos"
        )
    
    # Crear token JWT
    access_token_expires = timedelta(hours=ACCESS_TOKEN_EXPIRE_HOURS)
    access_token = create_access_token(
        data={
            "user_id": usuario.id,
            "email": usuario.email,
            "rol": usuario.rol
        },
        expires_delta=access_token_expires
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

@app.get("/usuarios/", response_model=list)
def listar_usuarios(db: Session = Depends(get_db)):
    """Listar todos los usuarios (público por ahora)"""
    usuarios = db.query(Usuario).all()
    return usuarios

# ============= ENDPOINTS PROTEGIDOS =============

@app.put("/usuarios/{usuario_id}")
def actualizar_usuario(
    usuario_id: int,
    usuario_update: UsuarioBase,
    token: str = None,
    db: Session = Depends(get_db)
):
    """Actualizar datos del usuario (PROTEGIDO)"""
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    
    # Validar token
    current = get_current_user(token, db)
    
    # Verificar que el usuario solo edite su propia cuenta
    if current["user"].id != usuario_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para editar esta cuenta")
    
    # Actualizar
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    usuario.nombre = usuario_update.nombre
    usuario.email = usuario_update.email
    usuario.telefono = usuario_update.telefono
    
    db.commit()
    db.refresh(usuario)
    return usuario

@app.delete("/usuarios/{usuario_id}")
def eliminar_usuario(
    usuario_id: int,
    token: str = None,
    db: Session = Depends(get_db)
):
    """Eliminar cuenta del usuario (PROTEGIDO)"""
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    
    # Validar token
    current = get_current_user(token, db)
    
    # Verificar que el usuario solo elimine su propia cuenta
    if current["user"].id != usuario_id:
        raise HTTPException(status_code=403, detail="No tienes permiso para eliminar esta cuenta")
    
    usuario = db.query(Usuario).filter(Usuario.id == usuario_id).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")
    
    # Eliminar registros asociados
    db.query(Registro).filter(Registro.usuario_id == usuario_id).delete()
    
    # Eliminar usuario
    db.delete(usuario)
    db.commit()
    
    return {"message": "Cuenta eliminada exitosamente"}

@app.get("/registros/")
def obtener_registros(token: str = None, db: Session = Depends(get_db)):
    """Obtener registros del usuario (PROTEGIDO)"""
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    
    current = get_current_user(token, db)
    usuario_id = current["user"].id
    
    registros = db.query(Registro).filter(Registro.usuario_id == usuario_id).all()
    return registros

@app.post("/registros/")
def crear_registro(
    registro: RegistroCreate,
    token: str = None,
    db: Session = Depends(get_db)
):
    """Crear nuevo registro de pesaje (PROTEGIDO)"""
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    
    current = get_current_user(token, db)
    
    # Verificar que el usuario solo cree registros para sí mismo
    if current["user"].id != registro.usuario_id:
        raise HTTPException(status_code=403, detail="No puedes crear registros para otro usuario")
    
    # Obtener factor CO2 de la categoría
    categoria = db.query(Categoria).filter(Categoria.id == registro.categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    # Calcular CO2
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
def eliminar_registro(
    registro_id: int,
    token: str = None,
    db: Session = Depends(get_db)
):
    """Eliminar un registro (PROTEGIDO)"""
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    
    current = get_current_user(token, db)
    
    registro = db.query(Registro).filter(Registro.id == registro_id).first()
    if not registro:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
    
    # Verificar que el usuario solo elimine sus propios registros
    if registro.usuario_id != current["user"].id:
        raise HTTPException(status_code=403, detail="No puedes eliminar registros de otro usuario")
    
    db.delete(registro)
    db.commit()
    
    return {"message": "Registro eliminado exitosamente"}

# ============= ENDPOINTS DE CATEGORÍAS =============

@app.get("/categorias/", response_model=list)
def obtener_categorias(db: Session = Depends(get_db)):
    """Obtener todas las categorías (PÚBLICO)"""
    categorias = db.query(Categoria).all()
    return categorias

@app.post("/categorias/")
def crear_categoria(
    categoria: CategoriaBase,
    token: str = None,
    db: Session = Depends(get_db)
):
    """Crear categoría (SOLO ADMIN)"""
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    
    current = get_current_user(token, db)
    
    # Verificar que sea admin
    if current["user"].rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden crear categorías")
    
    nueva_categoria = Categoria(
        nombre=categoria.nombre,
        factor_co2=categoria.factor_co2,
        descripcion=categoria.descripcion
    )
    
    db.add(nueva_categoria)
    db.commit()
    db.refresh(nueva_categoria)
    
    return nueva_categoria

@app.put("/categorias/{categoria_id}")
def actualizar_categoria(
    categoria_id: int,
    categoria_update: CategoriaBase,
    token: str = None,
    db: Session = Depends(get_db)
):
    """Actualizar categoría (SOLO ADMIN)"""
    if not token:
        raise HTTPException(status_code=401, detail="Token requerido")
    
    current = get_current_user(token, db)
    
    # Verificar que sea admin
    if current["user"].rol != "admin":
        raise HTTPException(status_code=403, detail="Solo administradores pueden editar categorías")
    
    categoria = db.query(Categoria).filter(Categoria.id == categoria_id).first()
    if not categoria:
        raise HTTPException(status_code=404, detail="Categoría no encontrada")
    
    # Normalizar coma a punto
    factor = str(categoria_update.factor_co2).replace(',', '.')
    
    categoria.nombre = categoria_update.nombre
    categoria.factor_co2 = float(factor)
    categoria.descripcion = categoria_update.descripcion
    
    db.commit()
    db.refresh(categoria)
    
    return categoria

# ============= HEALTH CHECK =============
@app.get("/")
def health():
    """Health check"""
    return {
        "status": "online",
        "version": "2.0 with JWT",
        "docs": "/docs"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)