# Build 2 giai đoạn — giai đoạn 1 build Frontend (React/Vite) ra file tĩnh, giai đoạn 2 chỉ cần
# Python để chạy Backend + phục vụ luôn file tĩnh đó (xem main.py phần "FRONTEND_DIST"). Image
# cuối KHÔNG chứa Node.js/node_modules — nhẹ hơn nhiều so với build 1 giai đoạn.

FROM node:20-slim AS frontend-build
WORKDIR /app/frontend
COPY md/frontend/package.json md/frontend/package-lock.json ./
RUN npm ci
COPY md/frontend/ ./
RUN npm run build

FROM python:3.11-slim
WORKDIR /app/backend
COPY md/backend/requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt
COPY md/backend/ ./
# main.py tính FRONTEND_DIST = Path(__file__).parent.parent / "frontend" / "dist"
# -> với WORKDIR /app/backend, đường dẫn đó chính là /app/frontend/dist.
COPY --from=frontend-build /app/frontend/dist /app/frontend/dist

ENV ENVIRONMENT=production
EXPOSE 8000

# Render/Railway tự cấp biến môi trường PORT — không hardcode 8000 trong lệnh chạy thật.
CMD ["sh", "-c", "uvicorn main:app --host 0.0.0.0 --port ${PORT:-8000}"]
