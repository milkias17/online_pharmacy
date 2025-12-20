# 💊 Medivo: Distributed Online Pharmacy Ecosystem

<p align="center">
<img src="https://img.shields.io/badge/Kubernetes-326CE5?style=for-the-badge&logo=kubernetes&logoColor=white" />
<img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" />
<img src="https://img.shields.io/badge/ArgoCD-FF7F01?style=for-the-badge&logo=argo&logoColor=white" />
<img src="https://img.shields.io/badge/Spring_Boot-6DB33F?style=for-the-badge&logo=spring-boot&logoColor=white" />
<img src="https://img.shields.io/badge/Django-092E20?style=for-the-badge&logo=django&logoColor=white" />
</p>

Transforming fragmented pharmaceutical silos into a unified, high-availability hyperlocal marketplace. ⚡

---

## 📖 Project Overview

Medivo is a polyglot microservices web application that bridges physical pharmacies and digital patients. Instead of centralized inventory, Medivo uses a distributed aggregation model so patients can query real-time stock across city-wide pharmacy nodes and place secure purchases with prescription handling.

---

## 🌟 Key Features

- 🔍 **Hyperlocal Search:** Find the nearest pharmacy with real-time stock.
- 🛒 **Secure Checkout:** ACID-compliant transaction management for medicine orders.
- 📄 **Prescription Handling:** Secure upload and validation workflow.
- 🔔 **Real-time Alerts:** Pub/Sub notifications for order status and low stock.
- 🏗️ **Cloud-Native:** Fully orchestrated with Kubernetes and managed via GitOps.

---

## 🏗️ System Architecture

Our system uses a decoupled, event-driven architecture for scale and fault tolerance.

| Service              | Language / Stack             | Responsibility                                        |
| :------------------- | :--------------------------- | :---------------------------------------------------- |
| Auth Service         | 🐍 **Python / Django**       | Identity management & JWT-based security.             |
| Inventory Service    | ☕ **Java / Spring Boot**    | High-concurrency stock tracking & optimistic locking. |
| Notification Service | 🟢 **Node.js / Prisma**      | Asynchronous event fan-out & user alerting.           |
| Database             | 🐘 **PostgreSQL (Supabase)** | Persistent storage via distributed cluster.           |

---

## 🛠️ Technology Stack

**Backend & Logic**

- Java (Spring Boot) — Inventory
- Python (Django) — Auth & business logic
- Node.js — Notification & lightweight event processors

**DevOps & Infrastructure**

- Orchestration: Kubernetes (k3s / k3d)
- GitOps: ArgoCD for automated deployment
- CI/CD: GitHub Actions (Docker builds & image publishing)
- Containerization: Docker (multi-stage optimized images)

---

## 🚀 Quick Start (Cloud-Native Deployment)

> These steps assume you are using a development environment such as GitHub Codespaces or a local machine with Docker and kubectl configured.

1. Install k3d (Kubernetes in Docker):

```bash
curl -s https://raw.githubusercontent.com/k3d-io/k3d/main/install.sh | bash
k3d cluster create pharmacy-cluster -p "8080:80@loadbalancer"
```

2. Deploy ArgoCD:

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
```

3. Apply manifests / Let ArgoCD sync the `./k8s` folder:

- ArgoCD will automatically pull and sync the `./k8s` directory to keep the cluster healthy.

4. Additional service-specific steps are in each service folder (see `Server/*`):

- `Server/auth-service`, `Server/inventory-service`, `Server/payment-service`, `Server/pharmacy-notification-service`.

---

## 📊 Project Roadmap

| Phase   | Milestone                              | Status         |
| :------ | :------------------------------------- | :------------- |
| Phase 0 | Initiation & Team Contract             | ✅ Complete    |
| Phase 1 | Containerization & K8s Architecture    | ✅ Complete    |
| Phase 2 | Frontend Integration (Next.js)         | ⏳ In Progress |
| Phase 3 | Resilience Testing (Chaos Engineering) | 📅 Scheduled   |
| Phase 4 | Final Distributed Demo                 | 📅 Jan 2026    |

---

## 👥 The Team

| Name                 | Role                           | Email                                  |
| :------------------- | :----------------------------- | :------------------------------------- |
| Miheret Girmachew    | Project Lead & Cloud Architect | miheret.girmachew@aastustudent.edu.et  |
| Mihret Desalegn      | Backend & Documentation Lead   | mihret.desalegn@aastustudent.edu.et    |
| Mikiyas Alemayehu M. | Backend Developer              | mikiyas.alemayehum@aastustudent.edu.et |
| Mikiyas Alemayehu G. | Integration & Pub-Sub Engineer | mikiyas.alemayehug@aastustudent.edu.et |
| Milkias Yeheyis      | DevOps & QA Engineer           | milkias.yeheyis@aastustudent.edu.et    |

---

## 🤝 Team Contract

- **Contribution:** Mandatory Git commits for every feature; task tracking via GitHub Projects.
- **Communication:** Telegram for daily syncs; weekly in-person architectural reviews.
- **Integrity:** Shared ownership of the codebase and peer-reviewed Pull Requests.

---

<p align="center">
Distributed Systems Project - Addis Ababa Science and Technology University (AASTU)  
**Department of Software Engineering**
</p>
