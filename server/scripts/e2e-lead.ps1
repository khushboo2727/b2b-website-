$ErrorActionPreference = 'Stop'
$base = 'http://localhost:5001'

$rand = Get-Random -Minimum 10000 -Maximum 99999
$sellerEmail = "seller$rand@example.com"
$buyerEmail  = "buyer$rand@example.com"

Write-Host "Registering seller $sellerEmail" -ForegroundColor Cyan
$sellerBody = @{ 
  name = 'Test Seller'
  email = $sellerEmail
  password = 'Passw0rd!'
  role = 'seller'
  phone = '9999999999'
  companyName = 'TestCo'
  address = 'IN'
}
try {
  $sellerReg = Invoke-RestMethod -Method Post -Uri "$base/api/auth/register" -ContentType 'application/json' -Body ($sellerBody | ConvertTo-Json -Depth 5)
} catch {
  Write-Host "Seller register failed: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
  throw
}
$sellerToken = $sellerReg.token
Write-Host "Seller token length: $($sellerToken.Length)" -ForegroundColor Green

Write-Host "Creating product as seller" -ForegroundColor Cyan
$prodBody = @{ 
  title = 'Sodium Chloride (Industrial Grade)'
  description = 'High purity sodium chloride for industrial applications'
  images = @()
  category = 'Chemicals'
  priceRange = @{ min = 100; max = 200; currency = 'INR' }
  specifications = @{ grade = 'Industrial'; purity = '99.5%'; moq = '1 MT' }
}
$headersSeller = @{ Authorization = "Bearer $sellerToken" }
try {
  $product = Invoke-RestMethod -Method Post -Uri "$base/api/products" -Headers $headersSeller -ContentType 'application/json' -Body ($prodBody | ConvertTo-Json -Depth 6)
} catch {
  Write-Host "Product create failed: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
  throw
}
Write-Host "Created product: $($product._id) in category $($product.category)" -ForegroundColor Green

Write-Host "Registering buyer $buyerEmail" -ForegroundColor Cyan
$buyerBody = @{ 
  name = 'Test Buyer'
  email = $buyerEmail
  password = 'Passw0rd!'
  role = 'buyer'
  phone = '8888888888'
}
try {
  $buyerReg = Invoke-RestMethod -Method Post -Uri "$base/api/auth/register" -ContentType 'application/json' -Body ($buyerBody | ConvertTo-Json -Depth 5)
} catch {
  Write-Host "Buyer register failed: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
  throw
}
$buyerToken = $buyerReg.token
Write-Host "Buyer token length: $($buyerToken.Length)" -ForegroundColor Green

Write-Host "Submitting lead as buyer" -ForegroundColor Cyan
$leadBody = @{ 
  productId = $product._id
  message = 'Looking for bulk purchase. Share best price and lead time.'
  buyerContact = @{ name='Buyer Ops'; email=$buyerEmail; phone='8888888888'; companyName='BuyerCo' }
  quantity = 5000
  budget = 150000
}
$headersBuyer = @{ Authorization = "Bearer $buyerToken" }
try {
  $lead = Invoke-RestMethod -Method Post -Uri "$base/api/leads" -Headers $headersBuyer -ContentType 'application/json' -Body ($leadBody | ConvertTo-Json -Depth 6)
} catch {
  Write-Host "Lead create failed: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
  throw
}
Write-Host "Created lead: $($lead._id) for product $($lead.productId)" -ForegroundColor Green

Start-Sleep -Seconds 1

Write-Host "Fetching seller notifications" -ForegroundColor Cyan
$notifUrl = "$base/api/notifications?page=1&limit=5"
try {
  $notifs = Invoke-RestMethod -Method Get -Uri $notifUrl -Headers $headersSeller
  $notifs | ConvertTo-Json -Depth 6 | Write-Output
} catch {
  Write-Host "Fetch notifications failed: $($_.Exception.Message)" -ForegroundColor Red
  if ($_.ErrorDetails.Message) { Write-Host $_.ErrorDetails.Message }
  throw
}