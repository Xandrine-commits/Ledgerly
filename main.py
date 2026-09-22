from fastapi import FastAPI, HTTPException,Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr, Field
from auth.auth import hash_password, verify_password
from auth.jwt import create_access_token
from jose import jwt, JWTError
from auth.jwt import SECRET_KEY, ALGORITHM
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/login")

def get_current_user(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(
            token,
            SECRET_KEY,
            algorithms=[ALGORITHM]
        )

        username = payload.get("sub")
        role = payload.get("role")

        if username is None:
            raise HTTPException(
                status_code=401,
                detail="Invalid token"
            )

        return {
            "username": username, 
            "role": role
        }

    except JWTError:
        raise HTTPException(
            status_code=401,
            detail="Invalid token"
        )

def require_admin(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=403,
            detail="Admin access required"
        )
    return current_user


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

users = [
    {
        "id": 1,
        "username": "admin",
        "password": hash_password("admin123"),
        "role": "admin"
    }
]



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

class User(BaseModel):
    username: str = Field(min_length=3)
    password: str = Field(min_length=6)

class LoginRequest(BaseModel):
    username: str
    password: str

@app.post("/api/register")
def register(user: User):
    hashed_password = hash_password(user.password)

    new_user = {
        "id": len(users) + 1,
        "username": user.username,
        "password": hashed_password,
        "role": "user"
    }

    users.append(new_user)

    return {
        "message": "User registered successfully",
        "username": new_user["username"]
    }

@app.post("/api/login")
def login(user: OAuth2PasswordRequestForm = Depends()):
    for existing_user in users:
        if existing_user["username"] == user.username:
            if verify_password(user.password, existing_user["password"]):
                access_token = create_access_token(
                    data={
                        "sub": existing_user["username"],
                        "role": existing_user.get("role", "user")
                    }
                )

                return {
                    "message": "Login successful",
                    "username": existing_user["username"],
                    "access_token": access_token,
                    "token_type": "bearer"
                }

            raise HTTPException(
                status_code=401,
                detail="Invalid username or password"
            )

    raise HTTPException(
        status_code=401,
        detail="Invalid username or password"
    )

@app.post("/api/orders")
def create_order(
    order: Order,
    current_user: dict = Depends(require_admin)
):
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
def get_orders(current_user: dict = Depends(get_current_user)):
    return orders

@app.get("/api/orders/{order_id}")
def get_order(order_id: int):
    for order in orders:
        if order["id"] == order_id:
            return order
    return {"message": "Order not found"}

@app.put("/api/orders/{order_id}")
def update_order(
    order_id: int, 
    order: Order,
    current_user: dict = Depends(require_admin)
):
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
def delete_order(
    order_id: int,
    current_user: dict = Depends(require_admin)
):
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
def get_customers(current_user: str = Depends(require_admin)):
    return customers

@app.get("/api/products")
def get_products(current_user: dict = Depends(get_current_user)):
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
def create_product(
    product: Product,
    current_user: dict = Depends(require_admin)
):
    new_product = {
        "id": len(products) + 1,
        "name": product.name,
        "price": product.price
    }

    products.append(new_product)
    return new_product

@app.put("/api/products/{product_id}")
def update_product(
    product_id: int,
    product: Product,
    current_user: dict = Depends(require_admin)
):
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
def delete_product(
    product_id: int,
    product: Product,
    current_user: dict = Depends(require_admin)
):
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
def create_customer(
    customer: Customer,
    current_user: dict = Depends(require_admin)
):
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
def update_customer(
    customer_id: int,
    customer: Customer,
    current_user: dict = Depends(require_admin)
):
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
def delete_customer(
    customer_id: int,
    current_user: dict = Depends(require_admin)
):
    for customer in customers:
        if customer["id"] == customer_id:
            customers.remove(customer)
            return {"message": "Customer deleted"}

    return {"message": "Customer not found"}