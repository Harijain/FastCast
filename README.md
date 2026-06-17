# FastCast

> Scalable Video Streaming Platform

> Event-driven OTT backend built with Spring Boot, Kafka, Redis, AWS S3, FFmpeg and HLS Streaming.

![Java](https://img.shields.io/badge/Java-21-orange)
![Spring Boot](https://img.shields.io/badge/SpringBoot-3.x-green)
![Kafka](https://img.shields.io/badge/Kafka-EventDriven-black)
![Redis](https://img.shields.io/badge/Redis-Cache-red)
![AWS S3](https://img.shields.io/badge/AWS-S3-yellow)
![Docker](https://img.shields.io/badge/Docker-Ready-blue)

FastCast is a scalable OTT video streaming platform designed using
modern backend engineering principles.

Instead of processing uploaded videos synchronously, FastCast leverages
an event-driven architecture using Apache Kafka and FFmpeg workers to
perform asynchronous HLS transcoding, significantly improving upload
latency and user experience.

The platform supports secure JWT authentication, adaptive bitrate
streaming, Redis caching, PostgreSQL persistence, S3 object storage,
Prometheus monitoring, and Dockerized deployment.

Core Features 
✔ JWT Authentication & Authorization

✔ Secure Video Upload

✔ Asynchronous Video Processing

✔ Kafka Event Pipeline

✔ FFmpeg HLS Transcoding

✔ Multi Quality Streaming (720p / 480p / 240p)

✔ AWS S3 Storage

✔ Redis Video Cache

✔ Dynamic Search & Pagination

✔ Watch History

✔ Download History

✔ Prometheus Metrics

✔ Swagger API Documentation

✔ Docker Compose Infrastructure

Architecture Diagram

<img width="1536" height="1024" alt="FastCast_Architecture" src="https://github.com/user-attachments/assets/9d2ef699-c20a-4523-85a2-bff7e7120779" />

File Upload Pipeline

Client Upload
      │
      ▼
Spring Boot API
      │
      ▼
Store Raw Video (AWS S3)
      │
      ▼
Publish Kafka Event
      │
      ▼
Kafka Consumer
      │
      ▼
FFmpeg Processing
      │
      ▼
Generate HLS Segments
      │
      ▼
Upload HLS Files to S3
      │
      ▼
Update Video Status
      │
      ▼
Ready for Streaming


Tech Stack
Layer	Technology
Language -	Java 17
Framework -	Spring Boot 3
Security -	Spring Security + JWT
Database -	PostgreSQL
Cache -	Redis
Messaging	- Apache Kafka
Storage	- AWS S3
Video Processing	- FFmpeg
Streaming	- HLS
Monitoring	- Prometheus
API Docs -	Swagger/OpenAPI
Build Tool -	Maven
Deployment -	Docker

Project Structure
Client
      │
      ▼
REST APIs
      │
      ▼
Spring Boot Backend
      │
 ┌────┼──────────────┐
 │    │              │
 ▼    ▼              ▼
Redis PostgreSQL   Kafka
                     │
                     ▼
              Video Processing
                     │
                     ▼
                  FFmpeg
                     │
                     ▼
                 AWS S3
                     │
                     ▼
              HLS Streaming


Performance Highlights

• Event Driven Architecture

• Stateless JWT Authentication

• Redis Caching Layer

• Asynchronous Video Processing

• HLS Adaptive Streaming

• Horizontal Scaling Ready

• Dockerized Infrastructure

• Prometheus Monitoring

API Endpoints
POST   /api/v1/auth/register

POST   /api/v1/auth/login

GET    /api/v1/auth/me

POST   /api/v1/videos/upload

GET    /api/v1/videos

POST   /api/v1/videos/search

GET    /api/v1/watch-history

POST   /api/v1/watch-history

GET    /api/v1/download/history

GET    /api/v1/metrics/summary
