import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, scoped_session
from sqlalchemy.ext.declarative import declarative_base
import logging

logger = logging.getLogger(__name__)

# Get database URL from environment variable or use SQLite for local development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./brands.db")

# Heroku provides PostgreSQL URLs starting with "postgres://" but SQLAlchemy needs "postgresql://"
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Create engine
try:
    engine = create_engine(DATABASE_URL, pool_size=5, max_overflow=0)
    logger.info(f"Database engine created for {DATABASE_URL.split('@')[0]}@...")
except Exception as e:
    logger.error(f"Error creating database engine: {str(e)}")
    raise

# Create session factory
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create thread-safe session factory
db_session = scoped_session(SessionLocal)

# Base class for models
Base = declarative_base()
Base.query = db_session.query_property()

def init_db():
    """Initialize database, creating tables if they don't exist"""
    try:
        # Import all models to ensure they're registered with Base
        from .models import BrandProfile, Playlist, Track
        
        # Create tables
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
        
        # If running locally and no brands exist, create Gucci template
        if DATABASE_URL.startswith("sqlite"):
            session = SessionLocal()
            try:
                if not session.query(BrandProfile).filter_by(id="gucci").first():
                    gucci_template = {
                        "brand": "GUCCI",
                        "brand_essence": {
                            "core_identity": "Eclectic, contemporary, romantic",
                            "heritage": "Founded in Florence in 1921, Gucci represents the pinnacle of Italian craftsmanship and elegance",
                            "brand_voice": "Bold, sophisticated, inclusive yet exclusive"
                        },
                        "aesthetic_pillars": {
                            "visual_language": [
                                "Maximalist luxury",
                                "Contemporary eclecticism",
                                "Romantic heritage",
                                "Artistic irreverence",
                                "Renaissance meets street culture"
                            ],
                            "emotional_attributes": [
                                "Empowered",
                                "Sophisticated",
                                "Daring",
                                "Self-expressive",
                                "Culturally fluid"
                            ],
                            "signature_elements": [
                                "Blend of historical elements with contemporary culture",
                                "Subversive romanticism",
                                "Luxurious disruption",
                                "Gender fluid expression",
                                "Bold pattern mixing"
                            ]
                        },
                        "cultural_positioning": {
                            "philosophy": "Progressive, inclusive and sustainable luxury that drives a positive change",
                            "core_values": [
                                "Creative freedom",
                                "Respect for heritage",
                                "Sustainable innovation",
                                "Inclusivity within exclusivity",
                                "Artistic collaboration"
                            ],
                            "cultural_codes": [
                                "High art meets street culture",
                                "Digital innovation with artisanal tradition",
                                "Sustainable luxury",
                                "Cultural fluidity",
                                "Generational inclusivity"
                            ]
                        },
                        "target_mindset": {
                            "aspirations": [
                                "Cultural leadership",
                                "Creative self-expression",
                                "Sophisticated rebellion",
                                "Social recognition",
                                "Artistic appreciation"
                            ],
                            "lifestyle_attributes": [
                                "Culturally engaged",
                                "Digitally native",
                                "Globally minded",
                                "Style-conscious",
                                "Experience-seeking"
                            ]
                        },
                        "brand_expressions": {
                            "tone": [
                                "Bold yet refined",
                                "Intellectually playful",
                                "Culturally informed",
                                "Artistically provocative",
                                "Confidently eccentric"
                            ],
                            "experience": [
                                "Immersive luxury",
                                "Digital innovation",
                                "Artistic dialogue",
                                "Cultural storytelling",
                                "Sustainable consciousness"
                            ]
                        },
                        "status": "approved"
                    }
                    
                    gucci = BrandProfile(
                        id="gucci",
                        name="GUCCI",
                        data=gucci_template
                    )
                    session.add(gucci)
                    session.commit()
                    logger.info("Created Gucci template brand profile")
            except Exception as e:
                logger.error(f"Error creating Gucci template: {str(e)}")
                session.rollback()
            finally:
                session.close()
                
    except Exception as e:
        logger.error(f"Error initializing database: {str(e)}")
        raise

def get_db():
    """Get database session"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()