# 1. 빌드 단계
FROM node:20-slim AS frontend-builder

# 2. 작업 디렉토리 설정
WORKDIR /usr/src/app

# 3. 패키지 파일 복사
COPY ./frontend/package.json ./frontend/pnpm-lock.yaml ./frontend/.npmrc ./

# 4. pnpm 설치
RUN npm install -g pnpm

# 5. 의존성 설치
RUN pnpm install --frozen-lockfile && pnpm cache clean

# 6. 소스 코드 복사
COPY ./frontend/. .

# 7. 빌드
RUN pnpm build

# 8. Nginx 이미지 사용
FROM nginx:alpine AS frontend

# 9. Nginx 설정 파일 복사 (필요 시)
COPY nginx.conf /etc/nginx/nginx.conf

# 10. 빌드된 파일 복사
COPY --from=frontend-builder /usr/src/app/dist /usr/share/nginx/html

# 11. Nginx 포트 노출
EXPOSE 80

# 12. Nginx 실행
CMD ["nginx", "-g", "daemon off;"]

# -------------------------

# 1. 베이스 이미지 설정
FROM node:20-slim AS backend-builder

# 2. 작업 디렉토리 생성 및 설정
WORKDIR /usr/src/app

# 3. 패키지 매니저 설치 (pnpm)
RUN npm install -g pnpm

# 4. 패키지 파일 복사
COPY ./backend/package.json ./backend/pnpm-lock.yaml ./

# 5. 의존성 설치
RUN pnpm install

# 6. 애플리케이션 소스 코드 복사
COPY ./backend/. .

# 7. 빌드
RUN pnpm build

# 8. 실제 실행을 위한 최종 이미지 설정
FROM node:20-slim AS backend

WORKDIR /usr/src/app

# 9. 빌드된 파일 복사
COPY --from=backend-builder /usr/src/app/dist ./dist

# 10. 필요한 의존성만 설치
COPY ./backend/package.json ./backend/pnpm-lock.yaml ./
RUN npm install -g pnpm
RUN pnpm install --prod

EXPOSE 4000

# 11. 애플리케이션 실행
CMD ["node", "dist/main"]
