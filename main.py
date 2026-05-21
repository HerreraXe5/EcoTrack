from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy import create_engine, Column, Integer, String, Float
from sqlalchemy.orm import declarative_base, sessionmaker, Session
from pydantic import BaseModel

# 1. CONFIGURACIÓN DE LA BASE DE DATOS (SQLite)
SQLALCHEMY_DATABASE_URL = "sqlite:///./ecotrack.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# 2. MODELOS DE BASE DE DATOS (SQLAlchemy)
class UsuarioDB(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    puntos_eco = Column(Integer, default=0)

class RegistroReciclajeDB(Base):
    __tablename__ = "registros_reciclaje"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer)
    material = Column(String) # Ej: Plástico, Vidrio
    peso_kg = Column(Float)
    co2_ahorrado = Column(Float)

# Crear las tablas en la base de datos
Base.metadata.create_all(bind=engine)

# 3. ESQUEMAS DE VALIDACIÓN (Pydantic)
class UsuarioCrear(BaseModel):
    nombre: str
    email: str

class RegistroCrear(BaseModel):
    usuario_id: int
    material: str
    peso_kg: float

# 4. INICIALIZAR FASTAPI
app = FastAPI(title="EcoTrack API", description="API para el prototipo móvil EcoTrack")

# Dependencia para obtener la sesión de la base de datos
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# 5. RUTAS DE LA API (Endpoints)

@app.get("/")
def leer_raiz():
    return {"mensaje": "Bienvenido a la API de EcoTrack"}

# Ruta para crear un usuario (POST)
@app.post("/usuarios/")
def crear_usuario(usuario: UsuarioCrear, db: Session = Depends(get_db)):
    nuevo_usuario = UsuarioDB(nombre=usuario.nombre, email=usuario.email)
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

# Ruta para obtener todos los usuarios (GET)
@app.get("/usuarios/")
def obtener_usuarios(db: Session = Depends(get_db)):
    return db.query(UsuarioDB).all()

# Ruta para registrar reciclaje y calcular CO2 (POST)
@app.post("/registros/")
def crear_registro(registro: RegistroCrear, db: Session = Depends(get_db)):
    # Lógica de negocio simple: 1 kg de plástico ahorra ~1.5 kg de CO2
    factor_co2 = 1.5 if registro.material.lower() == "plastico" else 1.0
    co2_calculado = registro.peso_kg * factor_co2
    
    nuevo_registro = RegistroReciclajeDB(
        usuario_id=registro.usuario_id,
        material=registro.material,
        peso_kg=registro.peso_kg,
        co2_ahorrado=co2_calculado
    )
    db.add(nuevo_registro)
    db.commit()
    db.refresh(nuevo_registro)
    return nuevo_registro