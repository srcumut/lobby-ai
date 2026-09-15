$server = "http://127.0.0.1:8080"
$rand = Get-Random -Maximum 100000
$username = "testuser_$rand"
$email = "testuser_$rand@example.com"
$password = "Password123!"

Write-Host "Registering user..."
$regBody = @{
    username = $username
    email = $email
    password = $password
    display_name = "Test User $rand"
} | ConvertTo-Json
$regRes = Invoke-RestMethod -Method Post -Uri "$server/api/auth/register" -ContentType "application/json" -Body $regBody
Write-Host "Registered: $($regRes | ConvertTo-Json)"

Write-Host "Logging in..."
$loginBody = @{
    email = $email
    password = $password
} | ConvertTo-Json
$loginRes = Invoke-RestMethod -Method Post -Uri "$server/api/auth/login" -ContentType "application/json" -Body $loginBody
$token = $loginRes.access_token
Write-Host "Logged in. Token: $token"

$headers = @{
    Authorization = "Bearer $token"
}

Write-Host "Adding AI Credential..."
$credBody = @{
    provider = "OpenAI"
    api_key = "test_sk_12345"
} | ConvertTo-Json
$credRes = Invoke-RestMethod -Method Post -Uri "$server/api/ai/credentials" -Headers $headers -ContentType "application/json" -Body $credBody
Write-Host "Added Credential: $($credRes | ConvertTo-Json)"

Write-Host "Fetching Credentials..."
$creds = Invoke-RestMethod -Method Get -Uri "$server/api/ai/credentials" -Headers $headers
Write-Host "Fetched Credentials: $($creds | ConvertTo-Json)"

Write-Host "Creating AI Agent..."
$agentBody = @{
    username = "agent_$rand"
    name = "Test Agent $rand"
    provider = "OpenAI"
    model = "gpt-4o"
    custom_instructions = "Be helpful."
} | ConvertTo-Json
try {
    $agentRes = Invoke-RestMethod -Method Post -Uri "$server/api/ai/agents" -Headers $headers -ContentType "application/json" -Body $agentBody
    Write-Host "Created Agent: $($agentRes | ConvertTo-Json)"
} catch {
    Write-Host "Error creating agent: $($_.Exception.Message)"
    if ($_.ErrorDetails) { Write-Host $_.ErrorDetails.Message }
}
