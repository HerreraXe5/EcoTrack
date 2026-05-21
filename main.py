from fastapi import FastAPI, Depends, HTTPException, status
from sqlalchemy import create_engine, Column, Integer, String, Float, ForeignKey
from sqlalchemy.orm import declarative_base, sessionmaker, Session, relationship
from pydantic import BaseModel
from typing import List, Optional

# ==========================================
# 1. CONFIGURACIÓN DE BASE DE DATOS
# ==========================================
SQLALCHEMY_DATABASE_URL = "sqlite:///./ecotrack_v2.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

# ==========================================
# 2. MODELOS DE BASE DE DATOS (Normalización)
# ==========================================
class UsuarioDB(Base):
    __tablename__ = "usuarios"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    registros = relationship("RegistroReciclajeDB", back_populates="usuario", cascade="all, delete-orphan")

class CategoriaResiduoDB(Base):
    __tablename__ = "categorias_residuos"
    id = Column(Integer, primary_key=True, index=True)
    nombre = Column(String, unique=True, index=True) # Ej: Plástico, Vidrio
    factor_co2 = Column(Float) # CO2 ahorrado por Kg
    registros = relationship("RegistroReciclajeDB", back_populates="categoria")

class RegistroReciclajeDB(Base):
    __tablename__ = "registros_reciclaje"
    id = Column(Integer, primary_key=True, index=True)
    usuario_id = Column(Integer, ForeignKey("usuarios.id"))
    categoria_id = Column(Integer, ForeignKey("categorias_residuos.id"))
    peso_kg = Column(Float)
    co2_ahorrado = Column(Float)
    
    usuario = relationship("UsuarioDB", back_populates="registros")
    categoria = relationship("CategoriaResiduoDB", back_populates="registros")

Base.metadata.create_all(bind=engine)

# ==========================================
# 3. ESQUEMAS PYDANTIC (Validación de Datos)
# ==========================================
class UsuarioBase(BaseModel):
    nombre: str
    email: str

class UsuarioUpdate(BaseModel):
    nombre: Optional[str] = None
    email: Optional[str] = None

class CategoriaBase(BaseModel):
    nombre: str
    factor_co2: float

class RegistroCrear(BaseModel):
    usuario_id: int
    categoria_id: int
    peso_kg: float

# ==========================================
# 4. CONFIGURACIÓN DE LA API
# ==========================================
app = FastAPI(
    title="API EcoTrack RESTful", 
    description="Backend para gestión de reciclaje con CRUD completo y BD normalizada."
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# ==========================================
# 5. RUTAS CRUD: USUARIOS
# ==========================================
@app.post("/usuarios/", status_code=status.HTTP_201_CREATED, tags=["Usuarios"], summary="Crear un usuario nuevo")
def crear_usuario(usuario: UsuarioBase, db: Session = Depends(get_db)):
    nuevo_usuario = UsuarioDB(nombre=usuario.nombre, email=usuario.email)
    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)
    return nuevo_usuario

@app.get("/usuarios/", status_code=status.HTTP_200_OK, tags=["Usuarios"], summary="Listar todos los usuarios")
def leer_usuarios(db: Session = Depends(get_db)):
    return db.query(UsuarioDB).all()

@app.put("/usuarios/{usuario_id}", status_code=status.HTTP_200_OK, tags=["Usuarios"], summary="Actualizar usuario")
def actualizar_usuario(usuario_id: int, usuario: UsuarioUpdate, db: Session = Depends(get_db)):
    db_user = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_id).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    if usuario.nombre: db_user.nombre = usuario.nombre
    if usuario.email: db_user.email = usuario.email
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/usuarios/{usuario_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Usuarios"], summary="Eliminar usuario")
def eliminar_usuario(usuario_id: int, db: Session = Depends(get_db)):
    db_user = db.query(UsuarioDB).filter(UsuarioDB.id == usuario_id).first()
    if not db_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
    db.delete(db_user)
    db.commit()
    return None

# ==========================================
# 6. RUTAS CRUD: CATEGORÍAS DE RESIDUOS
# ==========================================
@app.post("/categorias/", status_code=status.HTTP_201_CREATED, tags=["Categorías"], summary="Crear categoría")
def crear_categoria(cat: CategoriaBase, db: Session = Depends(get_db)):
    nueva_cat = CategoriaResiduoDB(nombre=cat.nombre, factor_co2=cat.factor_co2)
    db.add(nueva_cat)
    db.commit()
    db.refresh(nueva_cat)
    return nueva_cat

@app.get("/categorias/", status_code=status.HTTP_200_OK, tags=["Categorías"], summary="Listar categorías")
def leer_categorias(db: Session = Depends(get_db)):
    return db.query(CategoriaResiduoDB).all()

@app.put("/categorias/{cat_id}", status_code=status.HTTP_200_OK, tags=["Categorías"], summary="Actualizar categoría")
def actualizar_categoria(cat_id: int, cat: CategoriaBase, db: Session = Depends(get_db)):
    db_cat = db.query(CategoriaResiduoDB).filter(CategoriaResiduoDB.id == cat_id).first()
    if not db_cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
    db_cat.nombre = cat.nombre
    db_cat.factor_co2 = cat.factor_co2
    db.commit()
    db.refresh(db_cat)
    return db_cat

@app.delete("/categorias/{cat_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Categorías"], summary="Eliminar categoría")
def eliminar_categoria(cat_id: int, db: Session = Depends(get_db)):
    db_cat = db.query(CategoriaResiduoDB).filter(CategoriaResiduoDB.id == cat_id).first()
    if not db_cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Categoría no encontrada")
    db.delete(db_cat)
    db.commit()
    return None

# ==========================================
# 7. RUTAS CRUD: REGISTROS DE RECICLAJE
# ==========================================
@app.post("/registros/", status_code=status.HTTP_201_CREATED, tags=["Registros"], summary="Crear un registro de reciclaje")
def crear_registro(registro: RegistroCrear, db: Session = Depends(get_db)):
    # Validar que existan usuario y categoría
    db_user = db.query(UsuarioDB).filter(UsuarioDB.id == registro.usuario_id).first()
    db_cat = db.query(CategoriaResiduoDB).filter(CategoriaResiduoDB.id == registro.categoria_id).first()
    
    if not db_user or not db_cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario o Categoría no existen")

    # Lógica de negocio: Calcular CO2
    co2_calculado = registro.peso_kg * db_cat.factor_co2
    
    nuevo_registro = RegistroReciclajeDB(
        usuario_id=registro.usuario_id,
        categoria_id=registro.categoria_id,
        peso_kg=registro.peso_kg,
        co2_ahorrado=co2_calculado
    )
    db.add(nuevo_registro)
    db.commit()
    db.refresh(nuevo_registro)
    return nuevo_registro

@app.get("/registros/", status_code=status.HTTP_200_OK, tags=["Registros"], summary="Listar registros")
def leer_registros(db: Session = Depends(get_db)):
    return db.query(RegistroReciclajeDB).all()

@app.delete("/registros/{reg_id}", status_code=status.HTTP_204_NO_CONTENT, tags=["Registros"], summary="Eliminar registro")
def eliminar_registro(reg_id: int, db: Session = Depends(get_db)):
    db_reg = db.query(RegistroReciclajeDB).filter(RegistroReciclajeDB.id == reg_id).first()
    if not db_reg:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Registro no encontrado")
    db.delete(db_reg)
    db.commit()
    return None