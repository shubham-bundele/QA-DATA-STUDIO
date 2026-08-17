/**
 * Pattern matching engine for field name to semantic type classification.
 * Uses exact name lookup, regex patterns, fuzzy matching, and token overlap
 * to determine the most likely semantic type for a given field name.
 */

import { normalize, tokenize, similarity } from "@/core/engines/string-utils";
import type { SemanticType, ClassificationScore } from "@/core/engines/types";

/** Minimum similarity threshold for fuzzy matching */
const FUZZY_THRESHOLD = 0.7;

/**
 * Field names that are ambiguous -- they match a semantic type dictionary
 * but are also commonly used for unrelated purposes. When one of these names
 * is the ONLY evidence (exact dictionary hit, no regex/token/fuzzy support),
 * the nameScore is capped at 0.5 to signal uncertainty.
 */
const AMBIGUOUS_NAMES = new Set([
  "name",      // full_name dict, but also product name, project name
  "title",     // job_title dict, but also page title, book title
  "state",     // state dict, but also workflow state
  "role",      // job_title dict, but also RBAC role
  "pass",      // password dict, but also boarding pass
  "account",   // fuzzy match to account_number, but also generic account
  "network",   // credit_card_type dict, but also networking
  "total",     // amount dict, but also non-monetary aggregation
  "sum",       // amount dict, but also non-monetary aggregation
  "team",      // department dict, but also sports team
  "unit",      // department dict, but also measurement unit
]);

/**
 * Dictionary mapping semantic types to arrays of known field names.
 * Names are stored in normalized (lowercase, underscore-separated) form.
 */
const NAME_DICTIONARY: Record<SemanticType, string[]> = {
  first_name: [
    "first_name",
    "firstname",
    "fname",
    "given_name",
    "givenname",
    "forename",
    "first",
  ],
  last_name: [
    "last_name",
    "lastname",
    "lname",
    "surname",
    "family_name",
    "familyname",
    "last",
  ],
  full_name: ["full_name", "fullname", "name", "display_name", "displayname"],
  email: [
    "email",
    "email_address",
    "emailaddress",
    "mail",
    "e_mail",
    "user_email",
    "contact_email",
  ],
  phone: [
    "phone",
    "phone_number",
    "phonenumber",
    "tel",
    "telephone",
    "mobile",
    "cell",
    "cell_phone",
    "cellphone",
    "mobile_number",
    "contact_number",
    "fax",
  ],
  dob: [
    "dob",
    "date_of_birth",
    "dateofbirth",
    "birthday",
    "birth_date",
    "birthdate",
    "born_on",
    "born_date",
  ],
  age: ["age", "user_age", "current_age"],
  gender: ["gender", "sex", "user_gender"],
  ssn: [
    "ssn",
    "social_security",
    "social_security_number",
    "sin",
    "national_id",
    "national_insurance",
    "tax_id",
    "tin",
  ],
  username: [
    "username",
    "user_name",
    "login",
    "login_name",
    "handle",
    "screen_name",
    "nick",
    "nickname",
  ],
  password: [
    "password",
    "passwd",
    "pass",
    "pwd",
    "secret",
    "user_password",
    "hashed_password",
    "password_hash",
  ],
  street: [
    "street",
    "street_address",
    "streetaddress",
    "address_line_1",
    "address_line1",
    "address1",
    "addressline1",
    "line1",
    "street_line",
    "address_line",
  ],
  city: ["city", "town", "municipality", "city_name", "locality"],
  state: [
    "state",
    "province",
    "region",
    "state_code",
    "state_province",
    "administrative_area",
  ],
  country: [
    "country",
    "country_code",
    "countrycode",
    "nation",
    "country_name",
    "country_iso",
  ],
  zipcode: [
    "zipcode",
    "zip_code",
    "zip",
    "postal_code",
    "postalcode",
    "postcode",
    "post_code",
    "postal",
  ],
  full_address: [
    "full_address",
    "fulladdress",
    "address",
    "mailing_address",
    "complete_address",
  ],
  latitude: ["latitude", "lat", "geo_lat", "coord_lat"],
  longitude: ["longitude", "lng", "lon", "geo_lng", "geo_lon", "coord_lng"],
  company: [
    "company",
    "company_name",
    "companyname",
    "organization",
    "org",
    "employer",
    "firm",
    "business_name",
  ],
  job_title: [
    "job_title",
    "jobtitle",
    "title",
    "position",
    "role",
    "job_role",
    "occupation",
    "designation",
  ],
  department: [
    "department",
    "dept",
    "division",
    "team",
    "unit",
    "business_unit",
  ],
  credit_card_number: [
    "card_number",
    "cardnumber",
    "credit_card",
    "creditcard",
    "cc_number",
    "ccnumber",
    "credit_card_number",
    "card_num",
    "pan",
  ],
  credit_card_cvv: [
    "cvv",
    "cvc",
    "cvv2",
    "cvc2",
    "security_code",
    "card_security_code",
    "card_verification",
  ],
  credit_card_expiry: [
    "expiry",
    "expiry_date",
    "expirydate",
    "expiration",
    "expiration_date",
    "exp_date",
    "card_expiry",
    "valid_thru",
    "valid_until",
  ],
  credit_card_type: [
    "card_type",
    "cardtype",
    "card_brand",
    "card_network",
    "network",
    "payment_network",
  ],
  iban: ["iban", "iban_number", "international_bank_account"],
  swift_code: [
    "swift",
    "swift_code",
    "swiftcode",
    "bic",
    "bic_code",
    "bank_identifier",
  ],
  routing_number: [
    "routing_number",
    "routingnumber",
    "routing",
    "aba",
    "aba_number",
    "sort_code",
    "bank_code",
  ],
  account_number: [
    "account_number",
    "accountnumber",
    "account_no",
    "acct_number",
    "acct_no",
    "bank_account",
    "bank_account_number",
  ],
  currency: [
    "currency",
    "currency_code",
    "currencycode",
    "ccy",
    "money_currency",
  ],
  amount: [
    "amount",
    "total",
    "price",
    "cost",
    "balance",
    "payment_amount",
    "transaction_amount",
    "subtotal",
    "grand_total",
    "sum",
  ],
  url: [
    "url",
    "website",
    "website_url",
    "link",
    "href",
    "homepage",
    "web_url",
    "site_url",
    "page_url",
  ],
  ip_address: [
    "ip_address",
    "ipaddress",
    "ip",
    "ip_addr",
    "client_ip",
    "server_ip",
    "remote_addr",
    "host_ip",
  ],
  uuid: ["uuid", "guid", "unique_id", "uid", "correlation_id", "trace_id"],
  domain: [
    "domain",
    "domain_name",
    "domainname",
    "hostname",
    "host",
    "server_name",
  ],
  mac_address: [
    "mac_address",
    "macaddress",
    "mac",
    "mac_addr",
    "hardware_address",
    "physical_address",
  ],
  boolean: [
    "is_active",
    "isactive",
    "enabled",
    "disabled",
    "active",
    "verified",
    "is_verified",
    "confirmed",
    "is_deleted",
    "deleted",
    "approved",
    "is_admin",
    "has_access",
    "flag",
  ],
  integer: ["count", "quantity", "qty", "num", "number_of", "total_count"],
  float: [
    "rate",
    "ratio",
    "percentage",
    "percent",
    "score",
    "rating",
    "weight",
    "height",
  ],
  string: [],
  date: [
    "date",
    "start_date",
    "end_date",
    "created_date",
    "due_date",
    "hire_date",
    "effective_date",
  ],
  datetime: [
    "datetime",
    "date_time",
    "event_time",
    "login_time",
    "logout_time",
  ],
  timestamp: [
    "timestamp",
    "ts",
    "created_at",
    "updated_at",
    "deleted_at",
    "modified_at",
    "last_modified",
    "last_login",
  ],
  enum: ["status", "type", "category", "priority", "level", "tier"],
  id: [
    "id",
    "pk",
    "primary_key",
    "record_id",
    "row_id",
    "entry_id",
    "item_id",
  ],
  foreign_key: [],
  unknown: [],
};

/**
 * Regex patterns for matching field names to semantic types.
 * Each pattern is tested against the normalized field name.
 */
const REGEX_PATTERNS: Array<{ pattern: RegExp; semanticType: SemanticType }> = [
  { pattern: /^(first[_]?name|f[_]?name|given[_]?name)$/, semanticType: "first_name" },
  { pattern: /^(last[_]?name|l[_]?name|sur[_]?name|family[_]?name)$/, semanticType: "last_name" },
  { pattern: /^(full[_]?name|display[_]?name)$/, semanticType: "full_name" },
  { pattern: /^(e[_]?mail|.*[_]?email[_]?.*|mail)$/, semanticType: "email" },
  { pattern: /user[_]?email/, semanticType: "email" },
  { pattern: /^(phone|tel|mobile|cell|fax)/, semanticType: "phone" },
  { pattern: /phone[_]?(num|number)/, semanticType: "phone" },
  { pattern: /(date[_]?of[_]?birth|birth[_]?d(ay|ate)|^dob$)/, semanticType: "dob" },
  { pattern: /^(age|user[_]?age)$/, semanticType: "age" },
  { pattern: /^(gender|sex)$/, semanticType: "gender" },
  { pattern: /^(ssn|social[_]?security|national[_]?id|tax[_]?id|tin)$/, semanticType: "ssn" },
  { pattern: /^(user[_]?name|login[_]?name|screen[_]?name|handle|nick)/, semanticType: "username" },
  { pattern: /^(pass(word|wd)?|pwd|secret)/, semanticType: "password" },
  { pattern: /(street|addr(ess)?[_]?line|address[_]?1|line[_]?1)/, semanticType: "street" },
  { pattern: /^(city|town|municipality|locality)$/, semanticType: "city" },
  { pattern: /^(state|province|region)([_]?(code|name))?$/, semanticType: "state" },
  { pattern: /^(country|nation)([_]?(code|name|iso))?$/, semanticType: "country" },
  { pattern: /^(zip[_]?code|zip|postal[_]?code|post[_]?code)$/, semanticType: "zipcode" },
  { pattern: /^(full[_]?)?address$/, semanticType: "full_address" },
  { pattern: /^(lat(itude)?|geo[_]?lat|coord[_]?lat)$/, semanticType: "latitude" },
  { pattern: /^(lng|lon(gitude)?|geo[_]?(lng|lon)|coord[_]?(lng|lon))$/, semanticType: "longitude" },
  { pattern: /^(company|org(anization)?|employer|firm|business[_]?name)$/, semanticType: "company" },
  { pattern: /^(job[_]?(title|role)|position|occupation|designation)$/, semanticType: "job_title" },
  { pattern: /^(department|dept|division|team|unit)$/, semanticType: "department" },
  { pattern: /(card[_]?num|cc[_]?num|credit[_]?card[_]?(num|number)?|pan)/, semanticType: "credit_card_number" },
  { pattern: /^(cvv|cvc|cvv2|cvc2|security[_]?code)$/, semanticType: "credit_card_cvv" },
  { pattern: /(expir(y|ation)|exp[_]?date|valid[_]?(thru|until))/, semanticType: "credit_card_expiry" },
  { pattern: /^(card[_]?(type|brand|network)|payment[_]?network)$/, semanticType: "credit_card_type" },
  { pattern: /^iban([_]?number)?$/, semanticType: "iban" },
  { pattern: /^(swift|bic)([_]?code)?$/, semanticType: "swift_code" },
  { pattern: /^(routing[_]?(number)?|aba([_]?number)?|sort[_]?code|bank[_]?code)$/, semanticType: "routing_number" },
  { pattern: /^(account[_]?(number|no|num)|acct[_]?(number|no|num)|bank[_]?account)/, semanticType: "account_number" },
  { pattern: /^(currency|currency[_]?code|ccy)$/, semanticType: "currency" },
  { pattern: /^(amount|total|price|cost|balance|subtotal|grand[_]?total)$/, semanticType: "amount" },
  { pattern: /^(url|website|link|href|homepage)/, semanticType: "url" },
  { pattern: /^(ip[_]?(address|addr)?|client[_]?ip|server[_]?ip|remote[_]?addr)$/, semanticType: "ip_address" },
  { pattern: /^(uuid|guid|unique[_]?id|uid|correlation[_]?id|trace[_]?id)$/, semanticType: "uuid" },
  { pattern: /^(domain([_]?name)?|host(name)?|server[_]?name)$/, semanticType: "domain" },
  { pattern: /^(mac[_]?(address|addr)?|hardware[_]?address|physical[_]?address)$/, semanticType: "mac_address" },
  { pattern: /^(is[_]|has[_]|can[_])/, semanticType: "boolean" },
  { pattern: /^(enabled|disabled|active|verified|confirmed|deleted|approved)$/, semanticType: "boolean" },
  { pattern: /^(created|updated|modified|deleted)[_]?(at|on|date|time)$/, semanticType: "timestamp" },
  { pattern: /^(timestamp|ts)$/, semanticType: "timestamp" },
  { pattern: /^(status|type|category|priority|level|tier|kind)$/, semanticType: "enum" },
  { pattern: /[_]?id$/, semanticType: "id" },
  { pattern: /^(date|.*[_]date)$/, semanticType: "date" },
  { pattern: /^(datetime|date[_]?time)$/, semanticType: "datetime" },
];

/**
 * Token sets that map to semantic types.
 * If most tokens in the set appear in the field name tokens, the type matches.
 */
const TOKEN_SETS: Array<{ tokens: string[]; semanticType: SemanticType }> = [
  { tokens: ["first", "name"], semanticType: "first_name" },
  { tokens: ["last", "name"], semanticType: "last_name" },
  { tokens: ["full", "name"], semanticType: "full_name" },
  { tokens: ["given", "name"], semanticType: "first_name" },
  { tokens: ["family", "name"], semanticType: "last_name" },
  { tokens: ["display", "name"], semanticType: "full_name" },
  { tokens: ["email", "address"], semanticType: "email" },
  { tokens: ["phone", "number"], semanticType: "phone" },
  { tokens: ["date", "of", "birth"], semanticType: "dob" },
  { tokens: ["birth", "date"], semanticType: "dob" },
  { tokens: ["social", "security"], semanticType: "ssn" },
  { tokens: ["user", "name"], semanticType: "username" },
  { tokens: ["street", "address"], semanticType: "street" },
  { tokens: ["address", "line"], semanticType: "street" },
  { tokens: ["zip", "code"], semanticType: "zipcode" },
  { tokens: ["postal", "code"], semanticType: "zipcode" },
  { tokens: ["post", "code"], semanticType: "zipcode" },
  { tokens: ["country", "code"], semanticType: "country" },
  { tokens: ["state", "code"], semanticType: "state" },
  { tokens: ["full", "address"], semanticType: "full_address" },
  { tokens: ["job", "title"], semanticType: "job_title" },
  { tokens: ["company", "name"], semanticType: "company" },
  { tokens: ["card", "number"], semanticType: "credit_card_number" },
  { tokens: ["credit", "card"], semanticType: "credit_card_number" },
  { tokens: ["security", "code"], semanticType: "credit_card_cvv" },
  { tokens: ["expiry", "date"], semanticType: "credit_card_expiry" },
  { tokens: ["expiration", "date"], semanticType: "credit_card_expiry" },
  { tokens: ["card", "type"], semanticType: "credit_card_type" },
  { tokens: ["card", "brand"], semanticType: "credit_card_type" },
  { tokens: ["swift", "code"], semanticType: "swift_code" },
  { tokens: ["routing", "number"], semanticType: "routing_number" },
  { tokens: ["account", "number"], semanticType: "account_number" },
  { tokens: ["bank", "account"], semanticType: "account_number" },
  { tokens: ["currency", "code"], semanticType: "currency" },
  { tokens: ["ip", "address"], semanticType: "ip_address" },
  { tokens: ["mac", "address"], semanticType: "mac_address" },
  { tokens: ["domain", "name"], semanticType: "domain" },
  { tokens: ["start", "date"], semanticType: "date" },
  { tokens: ["end", "date"], semanticType: "date" },
  { tokens: ["created", "at"], semanticType: "timestamp" },
  { tokens: ["updated", "at"], semanticType: "timestamp" },
  { tokens: ["modified", "at"], semanticType: "timestamp" },
  { tokens: ["deleted", "at"], semanticType: "timestamp" },
];

/**
 * PatternMatcher classifies field names into semantic types using
 * multiple strategies: exact match, regex, token overlap, and fuzzy matching.
 */
export class PatternMatcher {
  /**
   * Match a field name against all semantic types and return scored results
   * sorted by descending score.
   */
  match(fieldName: string, dataType?: string): ClassificationScore[] {
    const normalizedName = normalize(fieldName);
    const fieldTokens = tokenize(fieldName);
    const scores: ClassificationScore[] = [];

    const allTypes = Object.keys(NAME_DICTIONARY) as SemanticType[];

    for (const semanticType of allTypes) {
      if (semanticType === "unknown") continue;

      const nameScore = this.computeNameScore(
        normalizedName,
        fieldTokens,
        semanticType
      );
      const typeScore = dataType
        ? this.computeTypeCompatibility(dataType, semanticType)
        : 0;

      if (nameScore > 0 || typeScore > 0.5) {
        scores.push({
          semanticType,
          score: nameScore,
          breakdown: {
            nameScore,
            typeScore,
            constraintScore: 0,
            sampleScore: 0,
          },
        });
      }
    }

    scores.sort((a, b) => b.score - a.score);
    return scores;
  }

  /**
   * Compute a name-based score by combining exact match, regex, token overlap,
   * and fuzzy similarity results.
   */
  private computeNameScore(
    normalizedName: string,
    fieldTokens: string[],
    semanticType: SemanticType
  ): number {
    let bestScore = 0;

    // Strategy 1: Exact match in the dictionary
    const dictionary = NAME_DICTIONARY[semanticType];
    if (dictionary.includes(normalizedName)) {
      bestScore = Math.max(bestScore, 1.0);
    }

    // Strategy 2: Regex pattern match
    for (const entry of REGEX_PATTERNS) {
      if (
        entry.semanticType === semanticType &&
        entry.pattern.test(normalizedName)
      ) {
        bestScore = Math.max(bestScore, 0.9);
        break;
      }
    }

    // Strategy 3: Token overlap
    for (const entry of TOKEN_SETS) {
      if (entry.semanticType !== semanticType) continue;
      const matchedTokens = entry.tokens.filter((t) =>
        fieldTokens.includes(t)
      );
      const overlapRatio = matchedTokens.length / entry.tokens.length;
      if (overlapRatio >= 0.5) {
        bestScore = Math.max(bestScore, overlapRatio * 0.85);
      }
    }

    // Strategy 4: Fuzzy matching against dictionary entries
    if (bestScore < FUZZY_THRESHOLD) {
      for (const dictName of dictionary) {
        const sim = similarity(normalizedName, dictName);
        if (sim >= FUZZY_THRESHOLD) {
          bestScore = Math.max(bestScore, sim * 0.8);
        }
      }
    }

    // Cap score for ambiguous field names to reduce false positives
    if (AMBIGUOUS_NAMES.has(normalizedName) && bestScore > 0.5) {
      bestScore = 0.5;
    }

    return bestScore;
  }

  /**
   * Check if a data type is compatible with a semantic type.
   * Returns a score from 0 to 1.
   */
  private computeTypeCompatibility(
    dataType: string,
    semanticType: SemanticType
  ): number {
    const dt = dataType.toLowerCase();

    const STRING_TYPES = [
      "first_name",
      "last_name",
      "full_name",
      "email",
      "phone",
      "ssn",
      "username",
      "password",
      "street",
      "city",
      "state",
      "country",
      "zipcode",
      "full_address",
      "company",
      "job_title",
      "department",
      "credit_card_number",
      "credit_card_cvv",
      "credit_card_expiry",
      "credit_card_type",
      "iban",
      "swift_code",
      "routing_number",
      "account_number",
      "currency",
      "url",
      "ip_address",
      "uuid",
      "domain",
      "mac_address",
      "gender",
      "string",
      "enum",
    ] as SemanticType[];

    const NUMERIC_TYPES = [
      "age",
      "integer",
      "float",
      "amount",
      "latitude",
      "longitude",
      "id",
      "foreign_key",
    ] as SemanticType[];

    const BOOLEAN_TYPES = ["boolean"] as SemanticType[];

    const DATE_TYPES = [
      "dob",
      "date",
      "datetime",
      "timestamp",
    ] as SemanticType[];

    if (
      (dt === "string" || dt === "text" || dt === "varchar" || dt === "char") &&
      STRING_TYPES.includes(semanticType)
    ) {
      return 0.5;
    }
    if (
      (dt === "integer" ||
        dt === "int" ||
        dt === "bigint" ||
        dt === "smallint" ||
        dt === "number") &&
      NUMERIC_TYPES.includes(semanticType)
    ) {
      return 0.5;
    }
    if (
      (dt === "float" ||
        dt === "double" ||
        dt === "decimal" ||
        dt === "numeric" ||
        dt === "real" ||
        dt === "number") &&
      (NUMERIC_TYPES.includes(semanticType) || semanticType === "float")
    ) {
      return 0.5;
    }
    if (
      (dt === "boolean" || dt === "bool" || dt === "bit") &&
      BOOLEAN_TYPES.includes(semanticType)
    ) {
      return 0.7;
    }
    if (
      (dt === "date" ||
        dt === "datetime" ||
        dt === "timestamp" ||
        dt === "timestamptz") &&
      DATE_TYPES.includes(semanticType)
    ) {
      return 0.6;
    }

    return 0;
  }
}
