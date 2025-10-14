$ErrorActionPreference = 'Stop'
$base = 'http://localhost:5001'

$rand = Get-Random -Minimum 10000 -Maximum 99999
$sellerEmail = "rfqseller$rand@example.com"
$buyerEmail  = "rfqbuyer$rand@example.com"

Write-Host "Registering seller $sellerEmail" -ForegroundColor Cyan
$sellerBody = @{ 
  name = 'RFQ Seller'
  email = $sellerEmail
  password = 'Passw0rd!'
  role = 'seller'
  phone = '9999999999'
  companyName = 'RFQCo'
  address = 'IN'
}
$sellerReg = Invoke-RestMethod -Method Post -Uri "$base/api/auth/register" -ContentType 'application/json' -Body ($sellerBody | ConvertTo-Json -Depth 5)
$sellerToken = $sellerReg.token
Write-Host "Seller token length: $($sellerToken.Length)" -ForegroundColor Green

Write-Host "Creating product as seller" -ForegroundColor Cyan
$prodBody = @{ 
  title = 'Copper Sulfate (Industrial Grade)'
  description = 'Industrial grade copper sulfate for manufacturing'
  images = @()
  category = 'Chemicals'
  priceRange = @{ min = 500; max = 900; currency = 'INR' }
  specifications = @{ grade = 'Industrial'; purity = '98%'; moq = '1 MT' }
}
$headersSeller = @{ Authorization = "Bearer $sellerToken" }
$product = Invoke-RestMethod -Method Post -Uri "$base/api/products" -Headers $headersSeller -ContentType 'application/json' -Body ($prodBody | ConvertTo-Json -Depth 6)
Write-Host "Created product: $($product._id) in category $($product.category)" -ForegroundColor Green

Write-Host "Registering buyer $buyerEmail" -ForegroundColor Cyan
$buyerBody = @{ 
  name = 'RFQ Buyer'
  email = $buyerEmail
  password = 'Passw0rd!'
  role = 'buyer'
  phone = '8888888888'
}
$buyerReg = Invoke-RestMethod -Method Post -Uri "$base/api/auth/register" -ContentType 'application/json' -Body ($buyerBody | ConvertTo-Json -Depth 5)
$buyerToken = $buyerReg.token
Write-Host "Buyer token length: $($buyerToken.Length)" -ForegroundColor Green

Write-Host "Submitting RFQ as buyer" -ForegroundColor Cyan
$rfqBody = @{ 
  productId = $product._id
  quantity = 2500
  targetPrice = 700
  deliveryLocation = @{ address='Mumbai'; city='Mumbai'; state='MH'; pincode='400001'; country='India' }
  expectedDeliveryDate = (Get-Date).AddDays(30).ToString('yyyy-MM-dd')
  message = 'Need quote for Copper Sulfate bulk order.'
  buyerContact = @{ name='RFQ Ops'; email=$buyerEmail; phone='8888888888'; companyName='BuyerRFQ' }
}
$headersBuyer = @{ Authorization = "Bearer $buyerToken" }
$rfqRes = Invoke-RestMethod -Method Post -Uri "$base/api/rfq" -Headers $headersBuyer -ContentType 'application/json' -Body ($rfqBody | ConvertTo-Json -Depth 6)
Write-Host "RFQ submitted to sellers: $($rfqRes.totalSellers)" -ForegroundColor Green
$rfqId = $rfqRes.rfqs[0]._id
Write-Host "First RFQ ID: $rfqId" -ForegroundColor Yellow

Start-Sleep -Seconds 1

Write-Host "Fetching RFQ message logs (MessageLog)" -ForegroundColor Cyan
$messages = Invoke-RestMethod -Method Get -Uri "$base/api/rfq/$rfqId/messages" -Headers $headersBuyer
$messages | ConvertTo-Json -Depth 6 | Write-Output