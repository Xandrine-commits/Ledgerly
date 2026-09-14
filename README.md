# Ledgerly

Small Business Management System built with FastAPI and Vanilla JavaScript.

## Features

- Customer management
- Product management
- Order management
- Sales overview
- Dashboard
- CRUD operations
- API integration
- Data validation
- Error handling

## Tech Stack

### Frontend
- HTML
- CSS
- JavaScript

### Backend
- Python
- FastAPI
- Pydantic

### Database
- SQL
- SQLite

### Tools
- VS Code
- Git
- GitHub
- Swagger / OpenAPI

## API Endpoints

### Customers

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/customers` | Get all customers |
| GET | `/api/customers/{id}` | Get a customer |
| POST | `/api/customers` | Create a customer |
| PUT | `/api/customers/{id}` | Update a customer |
| DELETE | `/api/customers/{id}` | Delete a customer |

### Products

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/products` | Get all products |
| GET | `/api/products/{id}` | Get a product |
| POST | `/api/products` | Create a product |
| PUT | `/api/products/{id}` | Update a product |
| DELETE | `/api/products/{id}` | Delete a product |

### Orders

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/orders` | Get all orders |
| GET | `/api/orders/{id}` | Get an order |
| POST | `/api/orders` | Create an order |
| PUT | `/api/orders/{id}` | Update an order |
| DELETE | `/api/orders/{id}` | Delete an order |


## Database Structure

Ledgerly uses a relational database to store business data.

### Customers
- ID
- Name
- Email
- Phone
- Address

### Products
- ID
- Name
- Price

### Orders
- ID
- Customer ID
- Product ID
- Quantity
- Date
- Status
- Total

## Data Flow

Ledgerly follows a simple client-server architecture:

```text
Frontend (HTML/CSS/JavaScript)
            ↓
        FastAPI
            ↓
      REST API Endpoints
            ↓
        Database




## How to Run

### 1. Clone the repository

```bash
git clone https://github.com/Xandrine-commits/Ledgerly.git
cd Ledgerly

python -m venv venv
venv\Scripts\activate

pip install fastapi uvicorn pydantic email-validator

python -m uvicorn main:app --reload

http://127.0.0.1:8000

Frontend/index.html


Then commit:

```text
Add project setup instructions
