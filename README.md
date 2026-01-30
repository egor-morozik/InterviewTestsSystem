Для запуска создать .env файл на уровне docker-compose файла

#AI  
AI_TYPE=groq

#GROQ   GROQ_API_KEY=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

#DB  
DB_TYPE=qdrant

#QDRANT  
#QDRANT_URL can be http://localhost:6333 with Docker or QDRANT_CLUSTER_ENDPOINT
#QDRANT_CLUSTER_ENDPOINT=https://60b1fffc-953a-4564-9393-9b42cfa9c184.europe-west3-0.gcp.cloud.qdrant.io
QDRANT_URL=https://60b1fffc-953a-4564-9393-9b42cfa9c184.europe-west3-0.gcp.cloud.qdrant.io
QDRANT_API_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhY2Nlc3MiOiJtIn0.XGKdUUnhf8N8JP1zm33Pgm_3GYYNWDGZF-2bXEKm-c4

EMAIL_HOST_PASSWORD = 'вставить ваш'  
HOST = 127.0.0.1  
PORT = 8000  
HOST_PORT_FULL = f'https://{HOST}:{PORT}'

Поднять контейнер: docker-compose up -d  
Доступ: http://localhost/admin-panel  
login: admin  
pass: admin123
