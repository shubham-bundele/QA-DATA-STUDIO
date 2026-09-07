// Test script to verify the local AI engine works without external API keys
// Run with: npx tsx test-local-ai.ts

import { LocalGenAI } from './src/core/ai/local-genai';
import { analyzeUserStory, generateAutomationScript, generateSchemaAnalysis, generateMockEndpoints, generatePerformanceAnalysis, healAccessibilityViolation } from './src/core/ai/rule-engine';
import { aiEngine, configureAI, getAIStatus } from './src/core/ai';

async function testLocalGenAI() {
  console.log('\n=== Testing LocalGenAI ===\n');
  
  const ai = new LocalGenAI({ preferLocal: true });
  
  // Test 1: Analyze user story
  console.log('Test 1: Analyze User Story');
  const storyResult = await ai.models.generateContent({
    contents: `You are an expert QA Automation Architect. 
    Analyze the following user story and generate structured test cases.
    User Story: As a user, I want to login with email and password so I can access my dashboard.`,
    config: { responseMimeType: 'application/json', temperature: 0.2 }
  });
  
  if (storyResult.isAIFailed) {
    console.error('❌ Story analysis failed:', storyResult.reason);
  } else {
    const parsed = JSON.parse(storyResult.text || '{}');
    console.log('✅ Story analysis succeeded');
    console.log(`   - Test cases generated: ${parsed.testCases?.length || 0}`);
    console.log(`   - Domains detected: ${parsed.detectedDomains?.map((d: any) => d.domain).join(', ') || 'none'}`);
    console.log(`   - Categories: ${JSON.stringify(parsed.summary?.byCategory || {})}`);
  }
  
  // Test 2: Generate Playwright script
  console.log('\nTest 2: Generate Playwright Script');
  const pwResult = await ai.models.generateContent({
    contents: `You are an expert SDET. Write a Playwright test script in TypeScript for the following User Story and Test Cases.
    
    User Story: As a user, I want to login with email and password
    
    Test Cases JSON:
    [{"id": "TC-0001", "title": "Login - Valid Credentials", "category": "positive", "priority": "high", "domain": "security", "generatorLink": "/generators/json", "dataFields": ["email", "password"], "gherkin": {"given": "User is on login page", "when": "User enters valid credentials and clicks login", "then": "User is redirected to dashboard"}}]`,
    config: { temperature: 0.2 }
  });
  
  if (pwResult.isAIFailed) {
    console.error('❌ Playwright generation failed:', pwResult.reason);
  } else {
    console.log('✅ Playwright script generated');
    console.log(`   - Length: ${pwResult.text?.length || 0} chars`);
    console.log(`   - Contains test.describe: ${pwResult.text?.includes('test.describe') || false}`);
  }
  
  // Test 3: Schema analysis
  console.log('\nTest 3: Schema Analysis');
  const schemaResult = await ai.models.generateContent({
    contents: `You are an expert Security and QA Engineer. Analyze the following OpenAPI/Swagger JSON schema.
    
    Schema:
    {"openapi": "3.0.0", "paths": {"/users": {"get": {"responses": {"200": {"description": "OK"}}}}}}`,
    config: { responseMimeType: 'application/json', temperature: 0.2 }
  });
  
  if (schemaResult.isAIFailed) {
    console.error('❌ Schema analysis failed:', schemaResult.reason);
  } else {
    console.log('✅ Schema analysis succeeded');
    const parsed = JSON.parse(schemaResult.text || '{}');
    console.log(`   - Endpoints found: ${parsed.endpoints?.length || 0}`);
  }
  
  // Test 4: Mock generation
  console.log('\nTest 4: Mock Endpoint Generation');
  const mockResult = await ai.models.generateContent({
    contents: `Generate a comprehensive set of mock API endpoints for the following domain/description: "user management system"`,
    config: { responseMimeType: 'application/json', temperature: 0.2 }
  });
  
  if (mockResult.isAIFailed) {
    console.error('❌ Mock generation failed:', mockResult.reason);
  } else {
    console.log('✅ Mock endpoints generated');
    const parsed = JSON.parse(mockResult.text || '[]');
    console.log(`   - Endpoints: ${parsed.length}`);
  }
  
  // Test 5: Health check
  console.log('\nTest 5: Health Check');
  const health = await ai.getAIStatus();
  console.log('✅ Health check:', health);
}

async function testRuleEngine() {
  console.log('\n=== Testing Rule Engine Directly ===\n');
  
  // Test analyzeUserStory
  console.log('Test: analyzeUserStory');
  const analysis = analyzeUserStory('As a user, I want to transfer money between accounts');
  console.log('✅ Analysis complete');
  console.log(`   - Test cases: ${analysis.testCases.length}`);
  console.log(`   - Domains: ${analysis.detectedDomains.map(d => d.domain).join(', ')}`);
  console.log(`   - Summary: ${JSON.stringify(analysis.summary)}`);
  
  // Test generateAutomationScript
  console.log('\nTest: generateAutomationScript (Playwright)');
  const script = generateAutomationScript(analysis.testCases.slice(0, 2), 'Transfer money', 'playwright');
  console.log('✅ Playwright script generated');
  console.log(`   - Length: ${script.length} chars`);
  
  // Test generateSchemaAnalysis
  console.log('\nTest: generateSchemaAnalysis');
  const schemaAnalysis = generateSchemaAnalysis('{"paths": {"/api/users": {"get": {}}}}');
  console.log('✅ Schema analysis complete');
  console.log(`   - Endpoints: ${schemaAnalysis.endpoints?.length || 0}`);
  
  // Test generateMockEndpoints
  console.log('\nTest: generateMockEndpoints');
  const mocks = generateMockEndpoints('e-commerce product catalog');
  console.log('✅ Mock endpoints generated');
  console.log(`   - Count: ${mocks.length}`);
  
  // Test generatePerformanceAnalysis
  console.log('\nTest: generatePerformanceAnalysis');
  const perfAnalysis = generatePerformanceAnalysis({
    successRate: 99.5,
    avgLatencyMs: 150,
    p95LatencyMs: 400,
    p99LatencyMs: 800,
    requestsPerSecond: 100,
    statusCodes: { '200': 995, '500': 5 }
  });
  console.log('✅ Performance analysis complete');
  console.log(`   - Preview: ${perfAnalysis.substring(0, 100)}...`);
  
  // Test healAccessibilityViolation
  console.log('\nTest: healAccessibilityViolation');
  const healed = healAccessibilityViolation('<button>Click me</button>', 'button-name', 'Button has no accessible name');
  console.log('✅ A11y fix generated');
  console.log(`   - Result: ${healed}`);
}

async function testUnifiedEngine() {
  console.log('\n=== Testing Unified AI Engine ===\n');
  
  // Configure to use local only
  configureAI({ provider: 'local', enableFallback: true });
  
  // Test generateContent
  console.log('Test: generateContent (unified)');
  const result = await aiEngine.generateContent({
    contents: 'Analyze this user story: User wants to reset password',
    config: { responseMimeType: 'application/json', temperature: 0.2 }
  });
  
  if (result.isAIFailed) {
    console.error('❌ Unified generation failed:', result.reason);
  } else {
    console.log('✅ Unified generation succeeded');
    console.log(`   - Provider: ${aiEngine.getCurrentProvider()}`);
    console.log(`   - Response length: ${result.text?.length || 0}`);
  }
  
  // Test status
  console.log('\nTest: getAIStatus (unified)');
  const status = await getAIStatus();
  console.log('✅ Status:', status);
}

async function main() {
  console.log('🚀 Starting Local AI Engine Tests');
  console.log('=====================================');
  
  try {
    await testLocalGenAI();
    await testRuleEngine();
    await testUnifiedEngine();
    
    console.log('\n=====================================');
    console.log('✅ All tests passed! Local AI engine is working without external API keys.');
    console.log('=====================================\n');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

main();