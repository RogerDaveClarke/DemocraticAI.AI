# Query Firestore using REST API
# This allows you to query your Firestore database without additional tools

param(
    [Parameter(Mandatory=$false)]
    [string]$Collection = "members",
    
    [Parameter(Mandatory=$false)]
    [int]$Limit = 10,
    
    [Parameter(Mandatory=$false)]
    [string]$ProjectId = "replace-with-your-project-id"
)

Write-Host "Querying Firestore Collection: $Collection" -ForegroundColor Cyan
Write-Host "Limit: $Limit documents" -ForegroundColor Gray

try {
    # Get access token
    $token = gcloud auth print-access-token
    
    # Build the Firestore REST API URL
    $url = "https://firestore.googleapis.com/v1/projects/$ProjectId/databases/(default)/documents/$Collection"
    
    # Query Firestore
    $headers = @{
        "Authorization" = "Bearer $token"
        "Content-Type" = "application/json"
    }
    
    Write-Host "`nFetching documents..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "$url`?pageSize=$Limit" -Headers $headers -Method Get
    
    if ($response.documents) {
        Write-Host "`nFound $($response.documents.Count) documents:" -ForegroundColor Green
        Write-Host "=" * 80 -ForegroundColor Gray
        
        foreach ($doc in $response.documents) {
            $docId = $doc.name.Split('/')[-1]
            Write-Host "`nDocument ID: $docId" -ForegroundColor Cyan
            
            if ($doc.fields) {
                foreach ($field in $doc.fields.PSObject.Properties) {
                    $fieldName = $field.Name
                    $fieldValue = $field.Value
                    
                    # Extract the actual value based on type
                    $actualValue = if ($fieldValue.stringValue) { $fieldValue.stringValue }
                                  elseif ($fieldValue.integerValue) { $fieldValue.integerValue }
                                  elseif ($null -ne $fieldValue.booleanValue) { $fieldValue.booleanValue }
                                  elseif ($fieldValue.doubleValue) { $fieldValue.doubleValue }
                                  else { $fieldValue | ConvertTo-Json -Compress }
                    
                    Write-Host "  $fieldName`: $actualValue" -ForegroundColor Gray
                }
            }
            Write-Host "-" * 80 -ForegroundColor DarkGray
        }
        
        # Show specific fields for members
        if ($Collection -eq "members") {
            Write-Host "`nMember Summary:" -ForegroundColor Yellow
            Write-Host ("{0,-30} {1,-12} {2,-10} {3}" -f "Name", "Party", "Active", "Photo") -ForegroundColor Cyan
            Write-Host ("-" * 80) -ForegroundColor Gray
            
            foreach ($doc in $response.documents) {
                $name = if ($doc.fields.fullName.stringValue) { $doc.fields.fullName.stringValue } else { "N/A" }
                $party = if ($doc.fields.currentParty.stringValue) { $doc.fields.currentParty.stringValue } else { "N/A" }
                $active = if ($doc.fields.isActive.booleanValue) { "Yes" } else { "No" }
                $hasPhoto = if ($doc.fields.photoUrl.stringValue) { "Yes" } else { "No" }
                
                Write-Host ("{0,-30} {1,-12} {2,-10} {3}" -f $name, $party, $active, $hasPhoto) -ForegroundColor Gray
            }
        }
        
    } else {
        Write-Host "`nNo documents found in collection: $Collection" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host "`nError querying Firestore:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.ErrorDetails) {
        Write-Host "`nDetails:" -ForegroundColor Yellow
        Write-Host $_.ErrorDetails.Message -ForegroundColor Gray
    }
}

Write-Host "`n" -NoNewline
Write-Host "Usage Examples:" -ForegroundColor Yellow
Write-Host "  .\scripts\query-firestore-rest.ps1 -Collection members -Limit 5" -ForegroundColor Gray
Write-Host "  .\scripts\query-firestore-rest.ps1 -Collection parties -Limit 10" -ForegroundColor Gray
Write-Host "  .\scripts\query-firestore-rest.ps1 -Collection metadata" -ForegroundColor Gray
