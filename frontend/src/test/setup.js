// Adds the DOM matchers (toBeInTheDocument, toHaveTextContent, …) to expect,
// and clears rendered components between tests so one test's DOM can't leak
// into the next.
import "@testing-library/jest-dom/vitest";
import { cleanup } from "@testing-library/react";
import { afterEach } from "vitest";

afterEach(cleanup);
