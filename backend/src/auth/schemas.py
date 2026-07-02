from pydantic import BaseModel, EmailStr, Field

class LoginRequest(BaseModel):
    phone: str = Field(..., description="Investor's phone number")

class OTPVerifyRequest(BaseModel):
    phone: str = Field(..., description="Investor's phone number")
    otp: str = Field(..., description="6-digit OTP code")

class AdvisorLoginRequest(BaseModel):
    email: EmailStr = Field(..., description="Advisor's email address")
    password: str = Field(..., description="Advisor's plaintext password")

class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    role: str
    user_id: str

class TokenRefreshRequest(BaseModel):
    refresh_token: str

class SignupRequest(BaseModel):
    full_name: str = Field(..., description="Full name of the investor")
    email: EmailStr = Field(..., description="Email address")
    phone: str = Field(..., description="10-digit mobile number")
    pan: str = Field(..., description="10-character PAN number")
    date_of_birth: str = Field(..., description="Date of birth in YYYY-MM-DD format")
