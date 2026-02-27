from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1 import admin, auth, billing, plan, superadmin, tracking
from app.core.config import settings


@asynccontextmanager
async def lifespan(_: FastAPI):
    yield


app = FastAPI(title='Max Rep API', lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=['*'],
    allow_headers=['*'],
)


@app.get('/health')
def health():
    return {'status': 'ok', 'app': 'Max Rep'}


app.include_router(auth.router, prefix='/api/v1')
app.include_router(billing.router, prefix='/api/v1')
app.include_router(plan.router, prefix='/api/v1')
app.include_router(tracking.router, prefix='/api/v1')
app.include_router(admin.router, prefix='/api/v1')
app.include_router(superadmin.router, prefix='/api/v1')
