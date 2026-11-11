import { expect, it } from "vitest";
import { GET } from "./route";

const url = "https://xtara.ai/explore/areas/science-and-discovery";
const params = Promise.resolve({ areaId: "science-and-discovery" });

it("redirects an area link to its direction in the shared mind map", async () => {
  const response = await GET(new Request(url), { params });

  expect(response.status).toBe(307);
  expect(response.headers.get("location")).toBe(
    "/explore?view=map&direction=science-and-discovery&step=roles",
  );
});

it("carries a bookmarked career into the same direction", async () => {
  const response = await GET(new Request(`${url}?career=astronomer`), { params });

  expect(response.headers.get("location")).toBe(
    "/explore?view=map&direction=science-and-discovery&career=astronomer&step=work",
  );
});
