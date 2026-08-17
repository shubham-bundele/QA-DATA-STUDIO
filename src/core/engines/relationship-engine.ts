/**
 * Relationship detection engine. Discovers cross-field dependencies
 * including foreign key patterns, co-occurrence groups, conditional
 * relationships, and derived fields. Provides topological ordering
 * for correct generation order.
 */

import { normalize, tokenize } from "@/core/engines/string-utils";
import type {
  FieldDescriptor,
  RelationshipEdge,
  SemanticType,
} from "@/core/engines/types";

/**
 * Co-occurrence groups: fields that commonly appear together and
 * should have consistent, related values.
 */
const CO_OCCURRENCE_PATTERNS: Array<{
  group: SemanticType[];
  label: string;
}> = [
  {
    group: ["street", "city", "state", "zipcode", "country"],
    label: "address",
  },
  {
    group: ["full_address", "street", "city", "state", "zipcode"],
    label: "address",
  },
  {
    group: ["credit_card_number", "credit_card_cvv", "credit_card_expiry", "credit_card_type"],
    label: "credit_card",
  },
  {
    group: ["first_name", "last_name", "full_name"],
    label: "person_name",
  },
  {
    group: ["first_name", "last_name", "email"],
    label: "user_identity",
  },
  {
    group: ["latitude", "longitude"],
    label: "geo_coordinates",
  },
  {
    group: ["iban", "swift_code"],
    label: "international_banking",
  },
  {
    group: ["routing_number", "account_number"],
    label: "domestic_banking",
  },
  {
    group: ["company", "job_title", "department"],
    label: "employment",
  },
  {
    group: ["username", "password", "email"],
    label: "credentials",
  },
  {
    group: ["dob", "age"],
    label: "age_info",
  },
  {
    group: ["amount", "currency"],
    label: "monetary",
  },
];

/**
 * Conditional relationships: one field's value constrains another.
 */
const CONDITIONAL_PAIRS: Array<{
  from: SemanticType;
  to: SemanticType;
  description: string;
}> = [
  { from: "state", to: "zipcode", description: "State constrains valid zip codes" },
  { from: "country", to: "phone", description: "Country constrains phone format" },
  { from: "country", to: "zipcode", description: "Country constrains postal code format" },
  { from: "country", to: "state", description: "Country constrains valid states/provinces" },
  { from: "credit_card_type", to: "credit_card_number", description: "Card type constrains number prefix/length" },
  { from: "credit_card_type", to: "credit_card_cvv", description: "Card type constrains CVV length" },
  { from: "country", to: "iban", description: "Country constrains IBAN format" },
  { from: "currency", to: "amount", description: "Currency constrains amount format" },
];

/**
 * Derived field relationships: one field's value is computed from others.
 */
const DERIVED_FIELDS: Array<{
  derived: SemanticType;
  sources: SemanticType[];
  description: string;
}> = [
  { derived: "full_name", sources: ["first_name", "last_name"], description: "full_name = first_name + last_name" },
  { derived: "full_address", sources: ["street", "city", "state", "zipcode"], description: "full_address = street + city + state + zip" },
  { derived: "age", sources: ["dob"], description: "age derived from date of birth" },
  { derived: "email", sources: ["first_name", "last_name"], description: "email often derived from name" },
  { derived: "username", sources: ["first_name", "last_name"], description: "username often derived from name" },
];

/**
 * RelationshipEngine detects cross-field dependencies and determines
 * optimal generation order.
 */
export class RelationshipEngine {
  /**
   * Detect all relationship edges between fields.
   */
  detect(fields: FieldDescriptor[]): RelationshipEdge[] {
    const edges: RelationshipEdge[] = [];
    const fieldMap = new Map<string, FieldDescriptor>();

    for (const field of fields) {
      fieldMap.set(field.name, field);
    }

    // Detect foreign key patterns
    edges.push(...this.detectForeignKeys(fields));

    // Detect co-occurrence group edges
    edges.push(...this.detectCoOccurrences(fields));

    // Detect conditional relationships
    edges.push(...this.detectConditional(fields));

    // Detect derived field relationships
    edges.push(...this.detectDerived(fields));

    // Deduplicate edges
    return this.deduplicateEdges(edges);
  }

  /**
   * Sort fields in dependency order using Kahn's algorithm (topological sort).
   * Fields that others depend on come first.
   */
  getDependencyOrder(
    fields: FieldDescriptor[],
    edges: RelationshipEdge[]
  ): FieldDescriptor[] {
    const fieldNames = fields.map((f) => f.name);
    const fieldMap = new Map<string, FieldDescriptor>();
    for (const field of fields) {
      fieldMap.set(field.name, field);
    }

    // Build adjacency list and in-degree counts
    const adjList = new Map<string, string[]>();
    const inDegree = new Map<string, number>();

    for (const name of fieldNames) {
      adjList.set(name, []);
      inDegree.set(name, 0);
    }

    // For derived and conditional edges, "from" must be generated before "to"
    for (const edge of edges) {
      if (
        (edge.type === "derived" || edge.type === "conditional") &&
        adjList.has(edge.from) &&
        inDegree.has(edge.to)
      ) {
        adjList.get(edge.from)!.push(edge.to);
        inDegree.set(edge.to, (inDegree.get(edge.to) ?? 0) + 1);
      }
    }

    // Kahn's algorithm
    const queue: string[] = [];
    for (const [name, degree] of inDegree) {
      if (degree === 0) {
        queue.push(name);
      }
    }

    const sorted: string[] = [];
    while (queue.length > 0) {
      const current = queue.shift()!;
      sorted.push(current);

      const neighbors = adjList.get(current) ?? [];
      for (const neighbor of neighbors) {
        const newDegree = (inDegree.get(neighbor) ?? 1) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }

    // If there are cycles, append remaining fields at the end
    for (const name of fieldNames) {
      if (!sorted.includes(name)) {
        sorted.push(name);
      }
    }

    return sorted
      .map((name) => fieldMap.get(name))
      .filter((f): f is FieldDescriptor => f !== undefined);
  }

  /**
   * Get co-occurrence groups present in the given fields.
   * Returns arrays of field names that belong to the same group.
   */
  getCoOccurrenceGroups(fields: FieldDescriptor[]): string[][] {
    const fieldTypes = new Set(fields.map((f) => f.semanticType));
    const groups: string[][] = [];

    for (const pattern of CO_OCCURRENCE_PATTERNS) {
      const matchingFields = fields.filter((f) =>
        pattern.group.includes(f.semanticType)
      );

      // Only include a group if at least 2 fields from it are present
      if (matchingFields.length >= 2) {
        const group = matchingFields.map((f) => f.name);
        // Avoid duplicate groups
        const groupKey = [...group].sort().join(",");
        const exists = groups.some(
          (g) => [...g].sort().join(",") === groupKey
        );
        if (!exists) {
          groups.push(group);
        }
      }
    }

    return groups;
  }

  /**
   * Detect foreign key patterns: field name matches {entity}_id or {entity}Id.
   */
  private detectForeignKeys(fields: FieldDescriptor[]): RelationshipEdge[] {
    const edges: RelationshipEdge[] = [];

    for (const field of fields) {
      // Already classified as foreign key
      if (field.semanticType === "foreign_key") {
        edges.push({
          from: field.name,
          to: field.name,
          type: "foreign_key",
        });
        continue;
      }

      const tokens = tokenize(field.originalName);
      const normalizedName = normalize(field.originalName);

      // Check for pattern: {entity}_id, {entity}Id
      const fkMatch = normalizedName.match(/^(.+?)_?id$/);
      if (fkMatch && fkMatch[1] && fkMatch[1] !== field.name) {
        // Only mark as FK if the field isn't just "id"
        if (normalizedName !== "id" && normalizedName !== "pk") {
          // Look for a related entity field
          const entityName = fkMatch[1];
          const relatedField = fields.find(
            (f) =>
              f.name !== field.name &&
              (normalize(f.originalName) === entityName ||
                normalize(f.originalName) === entityName + "s" ||
                normalize(f.originalName) === entityName + "_name")
          );

          if (relatedField) {
            edges.push({
              from: relatedField.name,
              to: field.name,
              type: "foreign_key",
            });
          }
        }
      }
    }

    return edges;
  }

  /**
   * Detect co-occurrence relationships between fields.
   */
  private detectCoOccurrences(
    fields: FieldDescriptor[]
  ): RelationshipEdge[] {
    const edges: RelationshipEdge[] = [];

    for (const pattern of CO_OCCURRENCE_PATTERNS) {
      const matchingFields = fields.filter((f) =>
        pattern.group.includes(f.semanticType)
      );

      if (matchingFields.length >= 2) {
        // Create edges between all pairs in the co-occurrence group
        for (let i = 0; i < matchingFields.length; i++) {
          for (let j = i + 1; j < matchingFields.length; j++) {
            edges.push({
              from: matchingFields[i].name,
              to: matchingFields[j].name,
              type: "co_occurrence",
            });
          }
        }
      }
    }

    return edges;
  }

  /**
   * Detect conditional relationships between fields.
   */
  private detectConditional(
    fields: FieldDescriptor[]
  ): RelationshipEdge[] {
    const edges: RelationshipEdge[] = [];
    const fieldByType = new Map<SemanticType, FieldDescriptor>();

    for (const field of fields) {
      fieldByType.set(field.semanticType, field);
    }

    for (const pair of CONDITIONAL_PAIRS) {
      const fromField = fieldByType.get(pair.from);
      const toField = fieldByType.get(pair.to);

      if (fromField && toField) {
        edges.push({
          from: fromField.name,
          to: toField.name,
          type: "conditional",
        });
      }
    }

    return edges;
  }

  /**
   * Detect derived field relationships.
   */
  private detectDerived(fields: FieldDescriptor[]): RelationshipEdge[] {
    const edges: RelationshipEdge[] = [];
    const fieldByType = new Map<SemanticType, FieldDescriptor>();

    for (const field of fields) {
      fieldByType.set(field.semanticType, field);
    }

    for (const derived of DERIVED_FIELDS) {
      const derivedField = fieldByType.get(derived.derived);
      if (!derivedField) continue;

      const presentSources = derived.sources
        .map((s) => fieldByType.get(s))
        .filter((f): f is FieldDescriptor => f !== undefined);

      if (presentSources.length > 0) {
        for (const source of presentSources) {
          edges.push({
            from: source.name,
            to: derivedField.name,
            type: "derived",
          });
        }
      }
    }

    return edges;
  }

  /**
   * Remove duplicate edges.
   */
  private deduplicateEdges(edges: RelationshipEdge[]): RelationshipEdge[] {
    const seen = new Set<string>();
    const unique: RelationshipEdge[] = [];

    for (const edge of edges) {
      const key = `${edge.from}|${edge.to}|${edge.type}`;
      if (!seen.has(key)) {
        seen.add(key);
        unique.push(edge);
      }
    }

    return unique;
  }
}
