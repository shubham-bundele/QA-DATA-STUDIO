/**
 * QA Intelligence Engine - barrel export.
 * Re-exports all engine components for convenient access.
 */

// Types
export type {
  SemanticType,
  DataCategory,
  InputFormat,
  FieldConstraints,
  FieldDescriptor,
  ParsedSchema,
  ClassificationScore,
  RelationshipEdge,
} from "@/core/engines/types";

// String utilities
export {
  normalize,
  tokenize,
  levenshtein,
  similarity,
} from "@/core/engines/string-utils";

// Pattern matching
export { PatternMatcher } from "@/core/engines/pattern-matching";

// Schema detection
export { SchemaDetector } from "@/core/engines/schema-detection";

// Field classification
export { FieldClassifier } from "@/core/engines/field-classification";

// Boundary testing
export { BoundaryEngine } from "@/core/engines/boundary-engine";

// Security testing
export { SecurityEngine } from "@/core/engines/security-engine";

// Relationship detection
export { RelationshipEngine } from "@/core/engines/relationship-engine";

// Validation
export { ValidationEngine } from "@/core/engines/validation-engine";
export type {
  ValidationResult,
  RecordValidationResult,
} from "@/core/engines/validation-engine";

// Orchestrator (main pipeline)
export { Orchestrator } from "@/core/engines/orchestrator";
export type {
  IntelligentGenerationConfig,
  IntelligentGenerationResult,
} from "@/core/engines/orchestrator";

// User Story Analyzer
export { analyzeUserStory } from "@/core/engines/user-story-analyzer";
export type {
  TestCase,
  DetectedDomain,
  AnalysisResult,
} from "@/core/engines/user-story-analyzer";
