<div align="center">

# 🎬 FastCast

### Cloud-Native, Low-Latency Video Streaming Platform

[![Java](https://img.shields.io/badge/Java-17-orange?style=flat-square&logo=openjdk)](https://www.oracle.com/java/)
[![Spring Boot](https://img.shields.io/badge/Spring%20Boot-3.2-brightgreen?style=flat-square&logo=spring)](https://spring.io/projects/spring-boot)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-3178C6?style=flat-square&logo=typescript)](https://www.typescriptlang.org/)
[![AWS](https://img.shields.io/badge/AWS-EC2%20%7C%20S3-FF9900?style=flat-square&logo=amazonaws)](https://aws.amazon.com/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=flat-square&logo=docker)](https://www.docker.com/)
[![License](https://img.shields.io/badge/license-MIT-blue?style=flat-square)](LICENSE)

**[Live Demo](https://fastcast.1dt24cs406.workers.dev/) · [Report Bug](https://github.com/Harijain/FastCast/issues) · [Request Feature](https://github.com/Harijain/FastCast/issues)**

</div>

---

## 📖 Overview

**FastCast** is a distributed video streaming platform built to explore the real engineering trade-offs behind low-latency content delivery — chunk-based streaming, caching strategy, async processing, and horizontally scalable backend design.

Rather than serving full video files, FastCast implements industry-standard **HTTP Live Streaming (HLS)**, breaking videos into adaptive bitrate segments so playback can begin almost instantly and adjust quality in real time based on network conditions — the same approach used by production streaming platforms.

> This is a systems-engineering project first, a content platform second. The focus is on architecture: caching layers, message-driven processing, fault tolerance, and infrastructure-as-deployed-code.

---

## 🏗️ Architecture

<!-- TODO: Insert architecture diagram here -->
<div align="center">
  <img width="1536" height="1024" alt="FastCast_Architecture" src="https://github.com/user-attachments/assets/126b38c8-9aef-450c-9f99-7746c1f33270" />

</div>

**Request flow:** `Client → API Gateway (Spring Boot) → Redis Cache → PostgreSQL / S3 → HLS Segment Delivery → Client`

**Async video pipeline:** `Upload → Kafka Producer → FFmpeg Processing Worker → S3 (HLS chunks) → Kafka Consumer → DB metadata update`

---

## ✨ Key Features

| Category | Capability |
|---|---|
| 🔐 **Auth** | JWT-based authentication & authorization with Spring Security |
| 📹 **Streaming** | Adaptive bitrate HLS streaming (`.m3u8` + `.ts` segments), multiple quality renditions |
| ☁️ **Storage** | Durable video storage on Amazon S3 with signed URL access |
| ⚡ **Caching** | Redis-backed caching layer for metadata & hot-path reads, TTL + LRU eviction |
| 📩 **Async Processing** | Event-driven video transcoding pipeline via Apache Kafka (producer/consumer + DLT) |
| 📊 **Observability** | Latency tracking, cache hit ratio, and throughput metrics dashboard |
| 🛡️ **Resilience** | Graceful fallback on Redis/S3 failure, retry strategies, structured error handling |
| 📚 **API Docs** | Fully documented REST API via Swagger / OpenAPI |
| 🐳 **Containerized** | Multi-stage Docker builds, orchestrated via Docker Compose |
| ☁️ **Cloud Deployed** | Backend on AWS EC2, frontend on Cloudflare Workers (global edge delivery) |

---

## 🛠️ Tech Stack

<table>
<tr>
<td valign="top" width="50%">

**Backend**
- Java 17, Spring Boot 3.2
- Spring Security + JWT
- Spring Data JPA / Hibernate
- Flyway (schema migrations)
- Apache Kafka (event streaming)
- Redis (caching)
- FFmpeg (video transcoding)
- PostgreSQL

</td>
<td valign="top" width="50%">

**Frontend**
- React 19 + TypeScript
- TanStack Start / Router / Query
- Tailwind CSS + shadcn/ui
- HLS.js (adaptive playback)
- Zustand (state management)
- Axios

</td>
</tr>
<tr>
<td valign="top">

**Infrastructure**
- AWS EC2 (compute)
- AWS S3 (object storage)
- Docker + Docker Compose
- Cloudflare Workers (frontend edge deploy)
- Cloudflare Tunnel (HTTPS ingress)

</td>
<td valign="top">

**Tooling**
- Swagger / OpenAPI
- k6 (load testing)
- Prometheus-ready metrics
- GitHub Actions–compatible CI

</td>
</tr>
</table>

---

## 🚀 Getting Started

### Prerequisites

- Java 17+
- Node.js 18+
- Docker & Docker Compose
- Maven 3.9+
- An AWS account (S3 bucket + IAM credentials)

### Clone the repository

```bash
git clone https://github.com/Harijain/FastCast.git
cd FastCast
```

### Backend Setup

```bash
cd fastcast-backend
cp .env.example .env
# Fill in DB_PASSWORD, AWS_ACCESS_KEY, AWS_SECRET_KEY, JWT_SECRET

docker compose -f docker-compose.prod.yml build
docker compose -f docker-compose.prod.yml up -d
```

The backend will be available at `http://localhost:8080`.

Verify health:
```bash
curl http://localhost:8080/actuator/health
```

API documentation: `http://localhost:8080/swagger-ui.html`

### Frontend Setup

```bash
cd fastcast-frontend
npm install

# Configure environment
echo "VITE_API_BASE_URL=http://localhost:8080/api/v1" > .env
echo "VITE_USE_MOCKS=false" >> .env

npm run dev
```

The frontend will be available at `http://localhost:8080` (Vite dev server).

---

## 📂 Project Structure

```
FastCast/
├── fastcast-backend/
│   ├── src/main/java/com/fastcast/
│   │   ├── auth/            # JWT auth, security config
│   │   ├── video/           # Video upload, metadata, streaming
│   │   ├── processing/      # Kafka producers/consumers, FFmpeg
│   │   ├── cache/           # Redis caching layer
│   │   ├── metrics/         # Latency & performance tracking
│   │   ├── download/        # Download history
│   │   └── config/          # CORS, Security, AWS, Kafka, Redis config
│   ├── src/main/resources/db/migration/  # Flyway migrations
│   ├── Dockerfile
│   └── docker-compose.prod.yml
│
├── fastcast-frontend/
│   ├── src/
│   │   ├── api/             # Axios client, endpoints, health probe
│   │   ├── components/      # Reusable UI components
│   │   ├── services/        # Domain service layer
│   │   ├── routes/          # TanStack Router routes
│   │   └── layouts/         # App shell & layout
│   └── vite.config.ts
│
└── docs/
    └── architecture-diagram.png   # System architecture (placeholder)
```

---

## 🎯 System Design Highlights

**Caching strategy** — Redis sits in front of PostgreSQL for video metadata, reducing average API response time and absorbing read-heavy traffic spikes. Cache invalidation uses TTL expiry combined with LRU eviction.

**Async video pipeline** — Uploads don't block the request thread. A Kafka producer emits a processing event; a dedicated consumer picks it up, runs FFmpeg transcoding into multiple bitrate renditions, uploads HLS segments to S3, and updates video status — with a dead-letter topic for failed jobs.

**Resilience** — The system degrades gracefully: Redis outages fall back to direct DB reads, S3 failures trigger retries, and all failure paths return structured API errors rather than raw exceptions.

**Adaptive streaming** — Clients receive a master `.m3u8` playlist referencing multiple quality variants (240p/480p/720p), allowing HLS.js to switch renditions based on real-time bandwidth.

---

## 📊 Performance Targets

| Metric | Target |
|---|---|
| API latency (cached) | < 200ms |
| Streaming startup delay | < 2s |
| Concurrent users (simulated) | 100–500 |

---

## 🗺️ Roadmap

- [ ] CDN integration (CloudFront) for global edge caching of video segments
- [ ] Multi-region deployment
- [ ] Migration toward microservices for the processing pipeline
- [ ] Advanced load balancing across backend replicas
- [ ] AI-assisted content recommendations

---

## 📄 License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Hari Jain**

- GitHub: [@Harijain](https://github.com/Harijain)
- LinkedIn: [Connect with me](https://linkedin.com/in/hariyantha-c/)

---

<div align="center">

If you found this project interesting, consider giving it a ⭐!

</div>
