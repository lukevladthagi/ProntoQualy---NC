# Mocha Behavior Contracts

Generated before pass 09 from the original Mocha Worker source. These are
minimum route-preservation contracts that the Hono-to-Next conversion must
satisfy before the import can be considered feature-preserving.

- GET /api/ncs -> apps/web/src/app/api/ncs/route.ts
  Evidence: `app.get("/api/ncs", async (c) => {`
- GET /api/ncs/:id -> apps/web/src/app/api/ncs/[id]/route.ts
  Evidence: `app.get("/api/ncs/:id", async (c) => {`
- POST /api/ncs -> apps/web/src/app/api/ncs/route.ts
  Evidence: `app.post("/api/ncs", async (c) => {`
- PUT /api/ncs/:id -> apps/web/src/app/api/ncs/[id]/route.ts
  Evidence: `app.put("/api/ncs/:id", async (c) => {`
- PATCH /api/ncs/:id/nsp-analysis -> apps/web/src/app/api/ncs/[id]/nsp-analysis/route.ts
  Evidence: `app.patch("/api/ncs/:id/nsp-analysis", async (c) => {`
- PATCH /api/ncs/:id/status -> apps/web/src/app/api/ncs/[id]/status/route.ts
  Evidence: `app.patch("/api/ncs/:id/status", async (c) => {`
- DELETE /api/ncs/:id -> apps/web/src/app/api/ncs/[id]/route.ts
  Evidence: `app.delete("/api/ncs/:id", async (c) => {`
- POST /api/ncs/:ncId/evidencias -> apps/web/src/app/api/ncs/[ncId]/evidencias/route.ts
  Evidence: `app.post("/api/ncs/:ncId/evidencias", async (c) => {`
- DELETE /api/evidencias/:id -> apps/web/src/app/api/evidencias/[id]/route.ts
  Evidence: `app.delete("/api/evidencias/:id", async (c) => {`
- POST /api/ncs/:ncId/analises -> apps/web/src/app/api/ncs/[ncId]/analises/route.ts
  Evidence: `app.post("/api/ncs/:ncId/analises", async (c) => {`
- PUT /api/analises/:id -> apps/web/src/app/api/analises/[id]/route.ts
  Evidence: `app.put("/api/analises/:id", async (c) => {`
- GET /api/ncs/:ncId/planos-acao -> apps/web/src/app/api/ncs/[ncId]/planos-acao/route.ts
  Evidence: `app.get("/api/ncs/:ncId/planos-acao", async (c) => {`
- POST /api/ncs/:ncId/planos-acao -> apps/web/src/app/api/ncs/[ncId]/planos-acao/route.ts
  Evidence: `app.post("/api/ncs/:ncId/planos-acao", async (c) => {`
- PUT /api/planos-acao/:id -> apps/web/src/app/api/planos-acao/[id]/route.ts
  Evidence: `app.put("/api/planos-acao/:id", async (c) => {`
- DELETE /api/planos-acao/:id -> apps/web/src/app/api/planos-acao/[id]/route.ts
  Evidence: `app.delete("/api/planos-acao/:id", async (c) => {`
- POST /api/ncs/:ncId/verificacoes -> apps/web/src/app/api/ncs/[ncId]/verificacoes/route.ts
  Evidence: `app.post("/api/ncs/:ncId/verificacoes", async (c) => {`
- GET /api/dashboard/indicadores -> apps/web/src/app/api/dashboard/indicadores/route.ts
  Evidence: `app.get("/api/dashboard/indicadores", async (c) => {`
- GET /api/config/setores -> apps/web/src/app/api/config/setores/route.ts
  Evidence: `app.get("/api/config/setores", async (c) => {`
- POST /api/config/setores -> apps/web/src/app/api/config/setores/route.ts
  Evidence: `app.post("/api/config/setores", async (c) => {`
- PUT /api/config/setores/:id -> apps/web/src/app/api/config/setores/[id]/route.ts
  Evidence: `app.put("/api/config/setores/:id", async (c) => {`
- DELETE /api/config/setores/:id -> apps/web/src/app/api/config/setores/[id]/route.ts
  Evidence: `app.delete("/api/config/setores/:id", async (c) => {`
- GET /api/config/tipos-incidente -> apps/web/src/app/api/config/tipos-incidente/route.ts
  Evidence: `app.get("/api/config/tipos-incidente", async (c) => {`
- POST /api/config/tipos-incidente -> apps/web/src/app/api/config/tipos-incidente/route.ts
  Evidence: `app.post("/api/config/tipos-incidente", async (c) => {`
- PUT /api/config/tipos-incidente/:id -> apps/web/src/app/api/config/tipos-incidente/[id]/route.ts
  Evidence: `app.put("/api/config/tipos-incidente/:id", async (c) => {`
- DELETE /api/config/tipos-incidente/:id -> apps/web/src/app/api/config/tipos-incidente/[id]/route.ts
  Evidence: `app.delete("/api/config/tipos-incidente/:id", async (c) => {`
- GET /api/config/gravidades -> apps/web/src/app/api/config/gravidades/route.ts
  Evidence: `app.get("/api/config/gravidades", async (c) => {`
- POST /api/config/gravidades -> apps/web/src/app/api/config/gravidades/route.ts
  Evidence: `app.post("/api/config/gravidades", async (c) => {`
- PUT /api/config/gravidades/:id -> apps/web/src/app/api/config/gravidades/[id]/route.ts
  Evidence: `app.put("/api/config/gravidades/:id", async (c) => {`
- DELETE /api/config/gravidades/:id -> apps/web/src/app/api/config/gravidades/[id]/route.ts
  Evidence: `app.delete("/api/config/gravidades/:id", async (c) => {`
- GET /api/config/responsaveis -> apps/web/src/app/api/config/responsaveis/route.ts
  Evidence: `app.get("/api/config/responsaveis", async (c) => {`
- POST /api/config/responsaveis -> apps/web/src/app/api/config/responsaveis/route.ts
  Evidence: `app.post("/api/config/responsaveis", async (c) => {`
- PUT /api/config/responsaveis/:id -> apps/web/src/app/api/config/responsaveis/[id]/route.ts
  Evidence: `app.put("/api/config/responsaveis/:id", async (c) => {`
- DELETE /api/config/responsaveis/:id -> apps/web/src/app/api/config/responsaveis/[id]/route.ts
  Evidence: `app.delete("/api/config/responsaveis/:id", async (c) => {`
- GET /api/config/metas-internacionais -> apps/web/src/app/api/config/metas-internacionais/route.ts
  Evidence: `app.get("/api/config/metas-internacionais", async (c) => {`
- POST /api/config/metas-internacionais -> apps/web/src/app/api/config/metas-internacionais/route.ts
  Evidence: `app.post("/api/config/metas-internacionais", async (c) => {`
- PUT /api/config/metas-internacionais/:id -> apps/web/src/app/api/config/metas-internacionais/[id]/route.ts
  Evidence: `app.put("/api/config/metas-internacionais/:id", async (c) => {`
- DELETE /api/config/metas-internacionais/:id -> apps/web/src/app/api/config/metas-internacionais/[id]/route.ts
  Evidence: `app.delete("/api/config/metas-internacionais/:id", async (c) => {`
- GET /api/config/medicos -> apps/web/src/app/api/config/medicos/route.ts
  Evidence: `app.get("/api/config/medicos", async (c) => {`
- POST /api/config/medicos -> apps/web/src/app/api/config/medicos/route.ts
  Evidence: `app.post("/api/config/medicos", async (c) => {`
- PUT /api/config/medicos/:id -> apps/web/src/app/api/config/medicos/[id]/route.ts
  Evidence: `app.put("/api/config/medicos/:id", async (c) => {`
- DELETE /api/config/medicos/:id -> apps/web/src/app/api/config/medicos/[id]/route.ts
  Evidence: `app.delete("/api/config/medicos/:id", async (c) => {`
- GET /api/config/medicamentos -> apps/web/src/app/api/config/medicamentos/route.ts
  Evidence: `app.get("/api/config/medicamentos", async (c) => {`
- POST /api/config/medicamentos -> apps/web/src/app/api/config/medicamentos/route.ts
  Evidence: `app.post("/api/config/medicamentos", async (c) => {`
- PUT /api/config/medicamentos/:id -> apps/web/src/app/api/config/medicamentos/[id]/route.ts
  Evidence: `app.put("/api/config/medicamentos/:id", async (c) => {`
- DELETE /api/config/medicamentos/:id -> apps/web/src/app/api/config/medicamentos/[id]/route.ts
  Evidence: `app.delete("/api/config/medicamentos/:id", async (c) => {`
- GET /api/config/convenios -> apps/web/src/app/api/config/convenios/route.ts
  Evidence: `app.get("/api/config/convenios", async (c) => {`
- POST /api/config/convenios -> apps/web/src/app/api/config/convenios/route.ts
  Evidence: `app.post("/api/config/convenios", async (c) => {`
- PUT /api/config/convenios/:id -> apps/web/src/app/api/config/convenios/[id]/route.ts
  Evidence: `app.put("/api/config/convenios/:id", async (c) => {`
- DELETE /api/config/convenios/:id -> apps/web/src/app/api/config/convenios/[id]/route.ts
  Evidence: `app.delete("/api/config/convenios/:id", async (c) => {`
