from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    PROJECT_NAME: str = "TalentBridge System"
    SQLALCHEMY_DATABASE_URI: str = "postgresql://postgres:Roohi%402204@localhost:5432/talentbridge"
    SECRET_KEY: str = "supersecretkey"  # Change this in production
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    class Config:
        case_sensitive = True

settings = Settings()
