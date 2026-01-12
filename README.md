# 🛠 Repair Shop Orders — Technical MVP

Minimal web application that models the workflow between a repair shop and a customer for managing vehicle repair orders.

It supports:
- Creating and diagnosing orders  
- Adding services and components  
- Authorizing and re-authorizing work  
- Tracking real vs authorized costs  
- Handling over-cost rules (110% limit)  
- Customer approval, rejection, and change requests  

Two user views are included:
- **Workshop** (`/taller/ordenes`)
- **Client** (`/cliente/ordenes`)

---

## ▶️ How to run

```bash
npm install
npm run dev
```

Open in the browser:

```
http://localhost:5173
```

---

## 🧭 Main routes

### Workshop
```
/taller/ordenes
/taller/ordenes/:id
```

### Client
```
/cliente/ordenes
/cliente/ordenes/:id
```

---

## 🧪 Seeded data

The app starts with seeded orders in different states (CREATED, DIAGNOSED, WAITING_FOR_APPROVAL, etc.) so all workflows can be tested immediately.

