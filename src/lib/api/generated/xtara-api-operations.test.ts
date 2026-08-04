import { describe, expect, it } from "vitest";

import { XTARA_API_OPERATIONS, xtaraApiOperationPath } from "./xtara-api-operations";

describe("generated Xtara API operations", () => {
  it("keeps authenticated mutation metadata and encodes path parameters", () => {
    expect(XTARA_API_OPERATIONS.putSparksSparkIdProgress.authenticated).toBe(true);
    expect(
      xtaraApiOperationPath("putSparksSparkIdProgress", { sparkId: "spark/one" }),
    ).toBe("/api/v1/sparks/spark%2Fone/progress");
  });

  it("fails closed when a required path parameter is missing", () => {
    expect(() => xtaraApiOperationPath("getSparksSparkId")).toThrow(
      "Missing API path parameter: sparkId",
    );
  });
});
