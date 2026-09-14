from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

customers = []

products = []

orders = []


class Customer(BaseModel):
    name: str = Field(min_length=1)
    email: EmailStr
    phone: str = Field(min_length=1)
    address: str = Field(min_length=1)


class Product(BaseModel):
    name: str = Field(min_length=1)
    price: float = Field(gt=0)

class Order(BaseModel):
    customer_id: int
    product_id: int
    quantity: int = Field(gt=0)
    date: str
    status: str
    total: float = Field(gt=0)


@app.post("/api/orders")
def create_order(order: Order):
    new_order = {
        "id": len(orders) + 1,
        "customer_id": order.customer_id,
        "product_id": order.product_id,
        "quantity": order.quantity,
        "date": order.date,
        "status": order.status,
        "total": order.total

    }

    orders.append(new_order)
    return new_order

@app.get("/api/orders")  
def get_orders():
    return orders

@app.get("/api/orders/{order_id}")
def get_order(order_id: int):
    for order in orders:
        if order["id"] == order_id:
            return order
    return {"message": "Order not found"}

@app.put("/api/orders/{order_id}")
def update_order(order_id: int, order: Order):
    for item in orders:
        if item["id"] == order_id:
            item["customer_id"] = order.customer_id
            item["product_id"] = order.product_id
            item["quantity"] = order.quantity
            item["date"] = order.date
            item["status"] = order.status
            item["total"] = order.total
            return item

    raise HTTPException(
        status_code=404,
        detail="Order not found"
    )

@app.delete("/api/orders/{order_id}")
def delete_order(order_id: int):
    for order in orders:
        if order["id"] == order_id:
            orders.remove(order)
            return{"message": "Order deleted"}

    raise HTTPException(
            status_code=404,
            detail="Order not found"
        )

@app.get("/")                                              
def home():
    return {"message": "Python backend is working!"}

@app.get("/api/customers")
def get_customers():
    return customers

@app.get("/api/products")
def get_products():
    return products

@app.get("/api/products/{product_id}")
def get_product(product_id: int):
    for product in products:
        if product["id"] == product_id:
            return product

    raise HTTPException(
        status_code=404,
        detail="Product not Found"
    )

@app.post("/api/products")
def create_product(product: Product):
    new_product = {
        "id": len(products) + 1,
        "name": product.name,
        "price": product.price
    }

    products.append(new_product)
    return new_product

@app.put("/api/products/{product_id}")
def update_product(product_id: int, product: Product):
    for item in products:
        if item["id"] == product_id:
            item["name"] = product.name
            item["price"] = product.price
            return item

    raise HTTPException(
        status_code=404,
        detail="Product not found"
    )
        
    

@app.delete("/api/products/{product_id}")
def delete_product(product_id: int):
    for product in products:
        if product["id"] == product_id:
            products.remove(product)
            return {"message": "Product deleted"}

    return {"message": "Product not found"}


@app.get("/api/customers/{customer_id}")
def get_customer(customer_id: int):
    for customer in customers:
        if customer["id"] == customer_id:
            return customer

    raise HTTPException(
        status_code=404,
        detail="Customer not found"
    )


@app.post("/api/customers")
def create_customer(customer: Customer):
    new_customer = {
        "id": len(customers) + 1,
        "name": customer.name,
        "email": customer.email,
        "phone": customer.phone,
        "address": customer.address
    }

    customers.append(new_customer)
    return new_customer

@app.put("/api/customers/{customer_id}")
def update_customer(customer_id: int, customer: Customer):
    for item in customers:
        if item["id"] == customer_id:
            item["name"] = customer.name
            item["email"] = customer.email
            item["phone"] = customer.phone
            item["address"] = customer.address
            return item

    raise HTTPException(
        status_code=404,
        detail="Customer not found"
    )

@app.delete("/api/customers/{customer_id}")
def delete_customer(customer_id: int):
    for customer in customers:
        if customer["id"] == customer_id:
            customers.remove(customer)
            return {"message": "Customer deleted"}

    return {"message": "Customer not found"}