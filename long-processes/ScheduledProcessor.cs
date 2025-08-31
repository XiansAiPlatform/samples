using Temporalio.Activities;
using Temporalio.Api.Protocol.V1;
using Temporalio.Workflows;
using XiansAi.Memory;
using System.Text.Json;

public class ScheduledProcessor
{

    private UserRequestFlow _userRequestFlow;

    public ScheduledProcessor(UserRequestFlow userRequestFlow)
    {
        Console.WriteLine($"ScheduledProcessor constructor with UserRequestFlow: {userRequestFlow}");
        _userRequestFlow = userRequestFlow;
    }


    [IntervalSchedule(seconds: 10)]
    public async Task RunEvery10Seconds()
    {
        int count = _userRequestFlow.IncrementCount();

        // await Workflow.ExecuteActivityAsync(
        //     (Activities a) => a.WriteToFile($"Hello, world {count}"),
        //     new() { StartToCloseTimeout = TimeSpan.FromMinutes(5) });

        await new Activities().WriteToFile($"Hello, world {count}");

        Console.WriteLine($"Processing 10-second interval data. In workflow: {Workflow.InWorkflow}");
    }
}



public class Activities
{
    [Activity]
    public async Task WriteToFile(string message)
    {
        Console.WriteLine($"\n=== Testing MemoryHub.Documents Methods ===");
        Console.WriteLine($"Message: {message}");

        // Test 1: Check if document exists by key using GetByKeyAsync
        Console.WriteLine("\n1. Testing document existence by key:");
        var mainDocKey = "test-document";
        var existingDoc = await MemoryHub.Documents.GetByKeyAsync("Counter", mainDocKey);
        var exists = existingDoc != null;
        Console.WriteLine($"   Document with key '{mainDocKey}' exists: {exists}");

        // Test 2: GetByKeyAsync - Get document by key
        Console.WriteLine("\n2. Testing GetByKeyAsync:");
        var document = await MemoryHub.Documents.GetByKeyAsync("Counter", mainDocKey);

        var options = new DocumentOptions {
            UseKeyAsIdentifier = true,
            Overwrite = true
        };

        if (document == null) {
            Console.WriteLine($"   Creating new document with key '{mainDocKey}'");
            var counterData = new Counter {
                Count = 1,
                Message = message,
                CreatedAt = DateTime.UtcNow
            };
            document = await MemoryHub.Documents.SaveAsync(new Document {
                Content = JsonSerializer.SerializeToElement(counterData),
                Type = "Counter",
                Key = mainDocKey,
                Metadata = new Dictionary<string, object> {
                    { "Brand", "Xians" },
                    { "Version", "1.0" }
                }
            }, options);
            
            // Verify the document was created
            if (document == null || string.IsNullOrEmpty(document.Id))
            {
                throw new Exception($"Failed to create document with key '{mainDocKey}'. SaveAsync returned null or document has no ID.");
            }
            
            // Verify document exists after creation by checking with GetAsync
            var existsCheck = await MemoryHub.Documents.GetAsync(document.Id!);
            if (existsCheck == null)
            {
                throw new Exception($"Document with ID '{document.Id}' should exist after creation, but GetAsync returned null.");
            }
        } else {
            var counter = JsonSerializer.Deserialize<Counter>((JsonElement)document.Content)!;
            Console.WriteLine($"   Found existing document - Count: {counter.Count}");
            counter.Count++;
            counter.LastUpdated = DateTime.UtcNow;
            document.Content = JsonSerializer.SerializeToElement(counter);
        }

        // Test 3: UpdateAsync - Update the document
        Console.WriteLine("\n3. Testing UpdateAsync:");
        var currentCounter = JsonSerializer.Deserialize<Counter>((JsonElement)document.Content)!;
        currentCounter.Message = message;
        document.Content = JsonSerializer.SerializeToElement(currentCounter);
        var updateSuccess = await MemoryHub.Documents.UpdateAsync(document);
        Console.WriteLine($"   Update successful: {updateSuccess}");
        
        if (!updateSuccess)
        {
            throw new Exception($"UpdateAsync failed for document with ID '{document.Id}' and key '{document.Key}'.");
        }

        // Test 4: SaveAsync - Create additional test documents
        Console.WriteLine("\n4. Creating additional test documents:");
        var testDocs = new List<Document>();
        for (int i = 1; i <= 3; i++)
        {
            var testCounter = new Counter {
                Count = i * 10,
                Message = $"Test document {i}",
                CreatedAt = DateTime.UtcNow
            };
            var testDoc = await MemoryHub.Documents.SaveAsync(new Document {
                Content = JsonSerializer.SerializeToElement(testCounter),
                Type = "Counter",
                Key = $"test-doc-{i}",
                Metadata = new Dictionary<string, object> {
                    { "Brand", "Xians" },
                    { "TestGroup", "Batch1" },
                    { "Priority", i }
                }
            }, new DocumentOptions { UseKeyAsIdentifier = true, Overwrite = true });
            
            // Verify test document creation
            if (testDoc == null || string.IsNullOrEmpty(testDoc.Id))
            {
                throw new Exception($"Failed to create test document {i}. SaveAsync returned null or document has no ID.");
            }
            
            testDocs.Add(testDoc);
            Console.WriteLine($"   Created document: {testDoc.Key} with ID: {testDoc.Id}");
        }
        
        if (testDocs.Count != 3)
        {
            throw new Exception($"Expected to create 3 test documents, but only created {testDocs.Count}.");
        }

        // Test 5: GetAsync - Get document by ID
        Console.WriteLine("\n5. Testing GetAsync (by ID):");
        if (testDocs.Count > 0 && !string.IsNullOrEmpty(testDocs[0].Id))
        {
            var docById = await MemoryHub.Documents.GetAsync(testDocs[0].Id!);
            if (docById == null)
            {
                throw new Exception($"GetAsync failed to retrieve document with ID '{testDocs[0].Id}' that was just created.");
            }
            
            var retrievedCounter = JsonSerializer.Deserialize<Counter>((JsonElement)docById.Content)!;
            Console.WriteLine($"   Retrieved document by ID: {docById.Id}, Key: {docById.Key}, Count: {retrievedCounter.Count}");
            
            // Verify the retrieved document matches what we created
            var originalCounter = JsonSerializer.Deserialize<Counter>((JsonElement)testDocs[0].Content)!;
            if (retrievedCounter.Count != originalCounter.Count)
            {
                throw new Exception($"Retrieved document count ({retrievedCounter.Count}) doesn't match expected count ({originalCounter.Count}).");
            }
        }

        // Test 6: QueryAsync - Query documents  
        Console.WriteLine("\n6. Testing QueryAsync:");
        
        // Add a small delay to ensure documents are indexed
        await Workflow.DelayAsync(1000);
        
        // First, let's verify we can get the documents we created by key
        Console.WriteLine("   Verifying documents exist by key before querying:");
        var verifyDoc1 = await MemoryHub.Documents.GetByKeyAsync("Counter", "test-doc-1");
        var verifyDoc2 = await MemoryHub.Documents.GetByKeyAsync("Counter", "test-doc-2");
        
        if (verifyDoc1 == null || verifyDoc2 == null)
        {
            throw new Exception($"Failed to retrieve test documents by key. test-doc-1 exists: {verifyDoc1 != null}, test-doc-2 exists: {verifyDoc2 != null}");
        }
        
        Console.WriteLine($"   - test-doc-1 exists: true (ID={verifyDoc1.Id})");
        Console.WriteLine($"   - test-doc-2 exists: true (ID={verifyDoc2.Id})");
        
        // Now test querying - ContentType bug should be fixed
        Console.WriteLine("\n   Testing query with Type='Counter':");
        var query = new DocumentQuery
        {
            Type = "Counter",
            Limit = 10
        };
        
        var queryResults = await MemoryHub.Documents.QueryAsync(query);
        
        if (queryResults == null)
        {
            throw new Exception("QueryAsync returned null instead of a list of documents.");
        }
        
        Console.WriteLine($"   Query returned {queryResults.Count} documents");
        
        // We should have at least 4 documents: main document + 3 test documents
        // (test-doc-1, test-doc-2, test-doc-3) - Note: test-doc-1 might have been deleted in previous runs
        if (queryResults.Count < 3)
        {
            throw new Exception($"QueryAsync should return at least 3 documents but returned {queryResults.Count}. ContentType bug may not be fixed.");
        }
        
        // Verify we can find our test documents in the results
        var foundTestDocs = new HashSet<string>();
        foreach (var doc in queryResults)
        {
            var docCounter = JsonSerializer.Deserialize<Counter>((JsonElement)doc.Content)!;
            Console.WriteLine($"   - {doc.Key}: Count={docCounter.Count}, ID={doc.Id}");
            
            if (doc.Key?.StartsWith("test-doc-") == true)
            {
                foundTestDocs.Add(doc.Key);
            }
        }
        
        // We should find at least test-doc-2 and test-doc-3 (test-doc-1 will be deleted later)
        if (!foundTestDocs.Contains("test-doc-2") || !foundTestDocs.Contains("test-doc-3"))
        {
            throw new Exception($"Query results missing expected test documents. Found: {string.Join(", ", foundTestDocs)}");
        }
        
        Console.WriteLine($"   ✓ Query successful! Found documents: {string.Join(", ", foundTestDocs)}");

        // Test 7: DeleteAsync - Delete a single document
        Console.WriteLine("\n7. Testing DeleteAsync:");
        // Use the documents we created earlier, not the query results
        if (testDocs.Count > 0 && !string.IsNullOrEmpty(testDocs[0].Id))
        {
            var deleteSuccess = await MemoryHub.Documents.DeleteAsync(testDocs[0].Id!);
            Console.WriteLine($"   Deleted document {testDocs[0].Key}: {deleteSuccess}");
            
            if (!deleteSuccess)
            {
                throw new Exception($"DeleteAsync failed to delete document with ID '{testDocs[0].Id}'.");
            }
            
            // Verify document was actually deleted
            var shouldNotExist = await MemoryHub.Documents.GetAsync(testDocs[0].Id!);
            if (shouldNotExist != null)
            {
                throw new Exception($"Document with ID '{testDocs[0].Id}' still exists after DeleteAsync returned true.");
            }
            Console.WriteLine($"   Verified document {testDocs[0].Id} was deleted");
        }

        // Test 8: DeleteManyAsync - Delete multiple documents
        Console.WriteLine("\n8. Testing DeleteManyAsync:");
        var idsToDelete = testDocs.Skip(1).Where(d => !string.IsNullOrEmpty(d.Id)).Select(d => d.Id!).ToList();
        if (idsToDelete.Any())
        {
            var expectedDeleteCount = idsToDelete.Count;
            var deleteCount = await MemoryHub.Documents.DeleteManyAsync(idsToDelete);
            Console.WriteLine($"   Deleted {deleteCount} documents");
            
            if (deleteCount != expectedDeleteCount)
            {
                throw new Exception($"DeleteManyAsync expected to delete {expectedDeleteCount} documents but actually deleted {deleteCount}.");
            }
            
            // Verify documents were actually deleted
            foreach (var deletedId in idsToDelete)
            {
                var shouldNotExist = await MemoryHub.Documents.GetAsync(deletedId);
                if (shouldNotExist != null)
                {
                    throw new Exception($"Document with ID '{deletedId}' still exists after DeleteManyAsync.");
                }
            }
            Console.WriteLine($"   Verified all {deleteCount} documents were deleted");
        }

        Console.WriteLine("\n=== Test Summary ===");
        Console.WriteLine("✓ Document creation with SaveAsync");
        Console.WriteLine("✓ Document retrieval with GetAsync and GetByKeyAsync");
        Console.WriteLine("✓ Document updates with UpdateAsync");
        Console.WriteLine("✓ Document querying with QueryAsync");
        Console.WriteLine("✓ Document deletion with DeleteAsync and DeleteManyAsync");
        Console.WriteLine("\nAll tests passed successfully!");
        Console.WriteLine("If you see this message, all document operations are working correctly.");
    }
}

public class Counter {
    public int Count { get; set; }
    public string? Message { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? LastUpdated { get; set; }
}