$ErrorActionPreference = "Stop"
$BaseUrl = "http://localhost:8080/api"

Write-Host "Creating user1..."
try {
    $user1_res = Invoke-RestMethod -Uri "$BaseUrl/auth/register" -Method Post -Body (ConvertTo-Json @{
        username = "ai_tester"
        email = "ai_tester@test.com"
        password = "password123"
    }) -ContentType "application/json"
    $user1_token = $user1_res.access_token
} catch {
    Write-Host "User ai_tester already exists. Logging in..."
    $login_res = Invoke-RestMethod -Uri "$BaseUrl/auth/login" -Method Post -Body (ConvertTo-Json @{
        email = "ai_tester@test.com"
        password = "password123"
    }) -ContentType "application/json"
    $user1_token = $login_res.access_token
}

$headers = @{
    Authorization = "Bearer $user1_token"
    "Content-Type" = "application/json"
}

Write-Host "1. Adding AI Credential..."
$cred_res = Invoke-RestMethod -Uri "$BaseUrl/ai/credentials" -Method Post -Headers $headers -Body (ConvertTo-Json @{
    provider = "MockProvider"
    api_key = "mock_api_key_123"
})
Write-Host "Credential created with ID: $($cred_res.id)"

Write-Host "2. Getting AI Credentials..."
$creds = Invoke-RestMethod -Uri "$BaseUrl/ai/credentials" -Method Get -Headers $headers
Write-Host "Found $($creds.length) credentials."

Write-Host "3. Creating Agent (Bot User)..."
try {
    $agent_res = Invoke-RestMethod -Uri "$BaseUrl/ai/agents" -Method Post -Headers $headers -Body (ConvertTo-Json @{
        username = "mockbot"
        name = "Mock Bot"
        provider = "MockProvider"
        model = "mock-model-v1"
        personality_config = '{"trait": "helpful"}'
        interest_config = '{}'
        communication_config = '{}'
        behavior_config = '{}'
        custom_instructions = "You are a helpful assistant."
    })
    Write-Host "Agent created with ID: $($agent_res.id) and Bot ID: $($agent_res.user_id)"
} catch {
    Write-Host "Agent mockbot already exists."
}

Write-Host "4. Creating Lobby..."
$lobby_res = Invoke-RestMethod -Uri "$BaseUrl/lobbies" -Method Post -Headers $headers -Body (ConvertTo-Json @{
    name = "AI Test Lobby"
    description = "Testing AI Bot Mentions"
    is_private = $false
})
$lobby_id = $lobby_res.id
Write-Host "Lobby Created: $lobby_id"

Write-Host "5. Sending Message with mention @mockbot..."
$msg_res = Invoke-RestMethod -Uri "$BaseUrl/lobbies/$lobby_id/messages" -Method Post -Headers $headers -Body (ConvertTo-Json @{
    content = "Hello @mockbot, how are you?"
})
Write-Host "Message sent: $($msg_res.content)"

Write-Host "Waiting 2 seconds for bot response..."
Start-Sleep -Seconds 2

Write-Host "6. Fetching messages to see if bot replied..."
$messages = Invoke-RestMethod -Uri "$BaseUrl/lobbies/$lobby_id/messages" -Method Get -Headers $headers
foreach ($msg in $messages) {
    Write-Host "[$($msg.sender.username)]: $($msg.content)"
}

Write-Host "Phase 3 test script completed successfully!"
