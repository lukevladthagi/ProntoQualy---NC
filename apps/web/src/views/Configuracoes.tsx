"use client";

import { useEffect, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Download,
  Edit2,
  FileSpreadsheet,
  Plus,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";

interface ConfigItem {
  id: number | string;
  nome: string;
  is_ativo: boolean | number;
  [key: string]: any;
}

interface ConfigField {
  name: string;
  label: string;
  type: string;
  required?: boolean;
}

interface ConfigSection {
  title: string;
  apiPath: string;
  fileName: string;
  fields: ConfigField[];
  fixedPayload?: Record<string, any>;
}

interface UserItem {
  id: string;
  name: string | null;
  email: string;
  setor: string | null;
  perfil: string | null;
  setoresPermitidos: string[] | string | null;
}

const configSections: Record<string, ConfigSection> = {
  setores: {
    title: "Setores",
    apiPath: "/api/config/setores",
    fileName: "config-setores",
    fields: [{ name: "nome", label: "Nome do Setor", type: "text", required: true }],
  },
  tipos: {
    title: "Tipos de Incidente",
    apiPath: "/api/config/tipos-incidente",
    fileName: "config-tipos-incidente",
    fields: [{ name: "nome", label: "Nome do Tipo", type: "text", required: true }],
  },
  gravidades: {
    title: "Gravidades",
    apiPath: "/api/config/gravidades",
    fileName: "config-gravidades",
    fields: [
      { name: "nome", label: "Nome da Gravidade", type: "text", required: true },
      { name: "codigo", label: "Código", type: "text", required: true },
    ],
  },
  responsaveis: {
    title: "Responsáveis",
    apiPath: "/api/config/responsaveis",
    fileName: "config-responsaveis",
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "email", label: "E-mail", type: "email", required: true },
      { name: "setor", label: "Setor", type: "text" },
    ],
  },
  metas: {
    title: "Metas Internacionais",
    apiPath: "/api/config/metas-internacionais",
    fileName: "config-metas-internacionais",
    fields: [
      { name: "nome", label: "Nome da Meta", type: "text", required: true },
      { name: "descricao", label: "Descrição", type: "textarea" },
    ],
  },
  medicos: {
    title: "Médicos",
    apiPath: "/api/config/medicos",
    fileName: "config-medicos",
    fields: [
      { name: "nome", label: "Nome do Médico", type: "text", required: true },
      { name: "crm", label: "CRM", type: "text", required: true },
      { name: "especialidade", label: "Especialidade", type: "text" },
    ],
  },
  medicamentos: {
    title: "Medicamentos",
    apiPath: "/api/config/medicamentos",
    fileName: "config-medicamentos",
    fields: [
      { name: "nome", label: "Nome do Medicamento", type: "text", required: true },
      { name: "classe", label: "Classe Terapêutica", type: "text" },
    ],
  },
  convenios: {
    title: "Convênios",
    apiPath: "/api/config/convenios",
    fileName: "config-convenios",
    fields: [{ name: "nome", label: "Nome do Convênio", type: "text", required: true }],
  },
  eventosAdversos: {
    title: "Eventos Adversos",
    apiPath: "/api/config/opcoes-formulario?categoria=evento_adverso",
    fileName: "config-eventos-adversos",
    fixedPayload: { categoria: "evento_adverso" },
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "valor", label: "Código interno", type: "text" },
    ],
  },
  tiposNC: {
    title: "Tipos de NC",
    apiPath: "/api/config/opcoes-formulario?categoria=nao_conformidade",
    fileName: "config-tipos-nc",
    fixedPayload: { categoria: "nao_conformidade" },
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "valor", label: "Código interno", type: "text" },
    ],
  },
  locaisAcesso: {
    title: "Locais de Acesso",
    apiPath: "/api/config/opcoes-formulario?categoria=local_acesso",
    fileName: "config-locais-acesso",
    fixedPayload: { categoria: "local_acesso" },
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "valor", label: "Código interno", type: "text" },
    ],
  },
  locaisLesao: {
    title: "Locais de Lesão",
    apiPath: "/api/config/opcoes-formulario?categoria=local_lesao",
    fileName: "config-locais-lesao",
    fixedPayload: { categoria: "local_lesao" },
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "valor", label: "Código interno", type: "text" },
    ],
  },
  flebiteTipos: {
    title: "Tipos de Flebite",
    apiPath: "/api/config/opcoes-formulario?categoria=flebite_tipo",
    fileName: "config-tipos-flebite",
    fixedPayload: { categoria: "flebite_tipo" },
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "valor", label: "Código interno", type: "text" },
    ],
  },
  flebiteFatores: {
    title: "Fatores de Flebite",
    apiPath: "/api/config/opcoes-formulario?categoria=flebite_fator",
    fileName: "config-fatores-flebite",
    fixedPayload: { categoria: "flebite_fator" },
    fields: [
      { name: "nome", label: "Nome", type: "text", required: true },
      { name: "valor", label: "Código interno", type: "text" },
    ],
  },
};

const settingsGroups = [
  {
    title: "Cadastros básicos",
    items: [
      { key: "setores", label: "Setores" },
      { key: "tipos", label: "Tipos de Incidente" },
      { key: "gravidades", label: "Gravidades" },
      { key: "responsaveis", label: "Responsáveis" },
      { key: "metas", label: "Metas Internacionais" },
      { key: "medicos", label: "Médicos" },
      { key: "medicamentos", label: "Medicamentos" },
      { key: "convenios", label: "Convênios" },
    ],
  },
  {
    title: "Formulário de NC",
    items: [
      { key: "eventosAdversos", label: "Eventos Adversos" },
      { key: "tiposNC", label: "Tipos de NC" },
      { key: "locaisAcesso", label: "Locais de Acesso" },
      { key: "locaisLesao", label: "Locais de Lesão" },
      { key: "flebiteTipos", label: "Tipos de Flebite" },
      { key: "flebiteFatores", label: "Fatores de Flebite" },
    ],
  },
  {
    title: "Acesso",
    items: [{ key: "usuarios", label: "Usuários e permissões" }],
  },
];

function normalizeKey(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "");
}

function parseBoolean(value: unknown) {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value === 1;
  const normalized = String(value ?? "").trim().toLowerCase();
  if (!normalized) return true;
  return ["1", "sim", "s", "true", "ativo", "ativa"].includes(normalized);
}

function isActive(value: unknown) {
  return value === true || value === 1;
}

function ConfigList({ section }: { section: string }) {
  const [items, setItems] = useState<ConfigItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | string | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [importing, setImporting] = useState(false);
  const [importMessage, setImportMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const config = configSections[section];
  const apiBasePath = config.apiPath.split("?")[0];

  useEffect(() => {
    loadItems();
  }, [section]);

  const loadItems = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(config.apiPath, { cache: "no-store" });
      if (response.ok) {
        const data = await response.json();
        setItems(data);
      }
    } catch (error) {
      console.error("Error loading items:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdd = () => {
    setIsAdding(true);
    const initialData: Record<string, any> = {};
    config.fields.forEach((field) => {
      initialData[field.name] = "";
    });
    setFormData(initialData);
  };

  const handleEdit = (item: ConfigItem) => {
    setEditingId(item.id);
    const editData: Record<string, any> = {};
    config.fields.forEach((field) => {
      editData[field.name] = item[field.name] || "";
    });
    setFormData(editData);
  };

  const handleSave = async () => {
    try {
      const method = editingId ? "PUT" : "POST";
      const url = editingId ? `${apiBasePath}/${editingId}` : config.apiPath;

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config.fixedPayload, ...formData }),
      });

      if (response.ok) {
        await loadItems();
        setEditingId(null);
        setIsAdding(false);
        setFormData({});
      }
    } catch (error) {
      console.error("Error saving item:", error);
    }
  };

  const handleDelete = async (id: number | string) => {
    if (!confirm("Tem certeza que deseja excluir este item?")) return;

    try {
      const response = await fetch(`${apiBasePath}/${id}`, {
        method: "DELETE",
      });

      if (response.ok) await loadItems();
    } catch (error) {
      console.error("Error deleting item:", error);
    }
  };

  const handleToggleStatus = async (id: number | string, currentStatus: unknown) => {
    try {
      const response = await fetch(`${apiBasePath}/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...config.fixedPayload, is_ativo: !isActive(currentStatus) }),
      });

      if (response.ok) await loadItems();
    } catch (error) {
      console.error("Error toggling status:", error);
    }
  };

  const handleCancel = () => {
    setEditingId(null);
    setIsAdding(false);
    setFormData({});
  };

  const handleExport = async () => {
    const XLSX = await import("xlsx");
    const rows = items.map((item) => {
      const row: Record<string, unknown> = {
        id: item.id,
      };
      config.fields.forEach((field) => {
        row[field.label] = item[field.name] ?? "";
      });
      row.Ativo = isActive(item.is_ativo) ? "Sim" : "Não";
      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(rows.length ? rows : [{ id: "", Ativo: "" }]);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, config.title.slice(0, 31));
    XLSX.writeFile(workbook, `${config.fileName}.xlsx`);
  };

  const handleImportFile = async (file: File) => {
    setImporting(true);
    setImportMessage(null);

    try {
      const XLSX = await import("xlsx");
      const buffer = await file.arrayBuffer();
      const workbook = XLSX.read(buffer, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];
      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
        defval: "",
      });

      const currentItems = await fetch(config.apiPath, { cache: "no-store" }).then((res) => res.json());
      const byId = new Map<string, ConfigItem>(
        currentItems.map((item: ConfigItem) => [String(item.id), item]),
      );
      const byName = new Map<string, ConfigItem>(
        currentItems
          .filter((item: ConfigItem) => item.nome)
          .map((item: ConfigItem) => [String(item.nome).trim().toLowerCase(), item]),
      );

      const fieldAliases = new Map<string, string>();
      config.fields.forEach((field) => {
        fieldAliases.set(normalizeKey(field.name), field.name);
        fieldAliases.set(normalizeKey(field.label), field.name);
      });
      fieldAliases.set("ativo", "is_ativo");
      fieldAliases.set("isativo", "is_ativo");

      let created = 0;
      let updated = 0;
      let ignored = 0;

      for (const row of rows) {
        const payload: Record<string, unknown> = {};
        let id: string | null = null;

        Object.entries(row).forEach(([key, value]) => {
          const normalized = normalizeKey(key);
          if (normalized === "id") {
            id = String(value || "").trim() || null;
            return;
          }

          const fieldName = fieldAliases.get(normalized);
          if (!fieldName) return;

          payload[fieldName] = fieldName === "is_ativo" ? parseBoolean(value) : String(value ?? "").trim();
        });

        const hasRequiredFields = config.fields
          .filter((field) => field.required)
          .every((field) => String(payload[field.name] ?? "").trim() !== "");

        if (!hasRequiredFields) {
          ignored += 1;
          continue;
        }

        const existing = id ? byId.get(id) : byName.get(String(payload.nome ?? "").trim().toLowerCase());
        const response = await fetch(existing ? `${apiBasePath}/${existing.id}` : config.apiPath, {
          method: existing ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ...config.fixedPayload, ...payload }),
        });

        if (!response.ok) {
          ignored += 1;
          continue;
        }

        if (existing) updated += 1;
        else created += 1;
      }

      setImportMessage(
        `Importação concluída: ${created} criados, ${updated} atualizados, ${ignored} ignorados.`,
      );
      await loadItems();
    } catch (error) {
      console.error("Error importing config:", error);
      setImportMessage("Não foi possível importar a planilha. Confira o formato do arquivo.");
    } finally {
      setImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h3 className="text-lg font-semibold">{config.title}</h3>
          <p className="text-sm text-muted-foreground">
            Exporte a lista atual ou importe uma planilha com as mesmas colunas.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => {
              const file = event.target.files?.[0];
              if (file) void handleImportFile(file);
            }}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            variant="outline"
            disabled={importing}
          >
            <Upload className="mr-2 h-4 w-4" />
            {importing ? "Importando..." : "Importar Excel"}
          </Button>
          <Button onClick={handleExport} size="sm" variant="outline">
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
          {!isAdding && (
            <Button onClick={handleAdd} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Adicionar
            </Button>
          )}
        </div>
      </div>

      {importMessage && (
        <div className="flex items-center gap-2 rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-950">
          <FileSpreadsheet className="h-4 w-4" />
          {importMessage}
        </div>
      )}

      {isAdding && (
        <Card>
          <CardContent className="pt-6">
            <div className="grid gap-4 md:grid-cols-2">
              {config.fields.map((field) => (
                <div key={field.name} className="space-y-2">
                  <Label htmlFor={`add-${field.name}`}>
                    {field.label}
                    {field.required && <span className="ml-1 text-red-500">*</span>}
                  </Label>
                  {field.type === "textarea" ? (
                    <textarea
                      id={`add-${field.name}`}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                      rows={3}
                      value={formData[field.name] || ""}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      required={field.required}
                    />
                  ) : (
                    <Input
                      id={`add-${field.name}`}
                      type={field.type}
                      value={formData[field.name] || ""}
                      onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                      required={field.required}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-4 flex gap-2">
              <Button onClick={handleSave} size="sm">
                <Check className="mr-2 h-4 w-4" />
                Salvar
              </Button>
              <Button onClick={handleCancel} size="sm" variant="outline">
                <X className="mr-2 h-4 w-4" />
                Cancelar
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="space-y-2">
        {items.map((item) => (
          <Card key={item.id}>
            <CardContent className="p-4">
              {editingId === item.id ? (
                <div>
                  <div className="mb-4 grid gap-4 md:grid-cols-2">
                    {config.fields.map((field) => (
                      <div key={field.name} className="space-y-2">
                        <Label htmlFor={`edit-${field.name}`}>
                          {field.label}
                          {field.required && <span className="ml-1 text-red-500">*</span>}
                        </Label>
                        {field.type === "textarea" ? (
                          <textarea
                            id={`edit-${field.name}`}
                            className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            rows={3}
                            value={formData[field.name] || ""}
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                            required={field.required}
                          />
                        ) : (
                          <Input
                            id={`edit-${field.name}`}
                            type={field.type}
                            value={formData[field.name] || ""}
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                            required={field.required}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleSave} size="sm">
                      <Check className="mr-2 h-4 w-4" />
                      Salvar
                    </Button>
                    <Button onClick={handleCancel} size="sm" variant="outline">
                      <X className="mr-2 h-4 w-4" />
                      Cancelar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between gap-4">
                  <div className="flex-1">
                    {config.fields.map((field, idx) => (
                      <div
                        key={field.name}
                        className={idx > 0 ? "mt-1 text-sm text-muted-foreground" : "font-medium"}
                      >
                        {field.label}: {item[field.name] || "-"}
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant={isActive(item.is_ativo) ? "default" : "secondary"}>
                      {isActive(item.is_ativo) ? "Ativo" : "Inativo"}
                    </Badge>
                    <Button onClick={() => handleEdit(item)} size="sm" variant="ghost">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      onClick={() => handleToggleStatus(item.id, item.is_ativo)}
                      size="sm"
                      variant="ghost"
                    >
                      {isActive(item.is_ativo) ? (
                        <X className="h-4 w-4 text-amber-600" />
                      ) : (
                        <Check className="h-4 w-4 text-emerald-600" />
                      )}
                    </Button>
                    <Button onClick={() => handleDelete(item.id)} size="sm" variant="ghost">
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {items.length === 0 && !isAdding && (
          <div className="py-12 text-center text-muted-foreground">
            Nenhum item cadastrado. Clique em "Adicionar" para começar.
          </div>
        )}
      </div>
    </div>
  );
}

function parseSetoresPermitidos(value: UserItem["setoresPermitidos"]) {
  if (Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return [];
  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.map(String) : [];
  } catch {
    return [];
  }
}

function UsuariosPermissoes() {
  const [usuarios, setUsuarios] = useState<UserItem[]>([]);
  const [setores, setSetores] = useState<ConfigItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    perfil: "usuario",
    setor: "",
    setoresPermitidos: [] as string[],
  });

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usersResponse, sectorsResponse] = await Promise.all([
        fetch("/api/config/usuarios", { cache: "no-store" }),
        fetch("/api/config/setores", { cache: "no-store" }),
      ]);

      if (usersResponse.ok) setUsuarios(await usersResponse.json());
      if (sectorsResponse.ok) {
        const data = await sectorsResponse.json();
        setSetores(data.filter((item: ConfigItem) => item.nome && isActive(item.is_ativo)));
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, []);

  const handleEdit = (usuario: UserItem) => {
    const setoresPermitidos = parseSetoresPermitidos(usuario.setoresPermitidos);
    setEditingId(usuario.id);
    setFormData({
      name: usuario.name ?? "",
      perfil: usuario.perfil ?? "usuario",
      setor: usuario.setor ?? setoresPermitidos[0] ?? "",
      setoresPermitidos,
    });
  };

  const toggleSetor = (setor: string) => {
    setFormData((current) => {
      const exists = current.setoresPermitidos.includes(setor);
      const setoresPermitidos = exists
        ? current.setoresPermitidos.filter((item) => item !== setor)
        : [...current.setoresPermitidos, setor];

      return {
        ...current,
        setoresPermitidos,
        setor: current.setor || setoresPermitidos[0] || "",
      };
    });
  };

  const handleSave = async () => {
    if (!editingId) return;

    const setoresPermitidos =
      formData.perfil === "admin"
        ? setores.map((setor) => setor.nome)
        : formData.setoresPermitidos;

    const response = await fetch(`/api/config/usuarios/${editingId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...formData,
        setor: formData.setor || setoresPermitidos[0] || "",
        setoresPermitidos,
      }),
    });

    if (response.ok) {
      setEditingId(null);
      await loadData();
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-muted-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Users className="h-5 w-5 text-primary" />
          Usuários e permissões
        </h3>
        <p className="text-sm text-muted-foreground">
          Defina o perfil e quais setores cada pessoa pode acompanhar no sistema.
        </p>
      </div>

      <div className="space-y-3">
        {usuarios.map((usuario) => {
          const setoresUsuario = parseSetoresPermitidos(usuario.setoresPermitidos);
          const isEditing = editingId === usuario.id;

          return (
            <Card key={usuario.id}>
              <CardContent className="p-4">
                {isEditing ? (
                  <div className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-3">
                      <div className="space-y-2">
                        <Label>Nome</Label>
                        <Input
                          value={formData.name}
                          onChange={(event) => setFormData({ ...formData, name: event.target.value })}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Perfil</Label>
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={formData.perfil}
                          onChange={(event) => setFormData({ ...formData, perfil: event.target.value })}
                        >
                          <option value="usuario">Usuário</option>
                          <option value="gestor">Gestor</option>
                          <option value="admin">Administrador</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <Label>Setor principal</Label>
                        <select
                          className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                          value={formData.setor}
                          onChange={(event) => setFormData({ ...formData, setor: event.target.value })}
                        >
                          <option value="">Selecione</option>
                          {setores.map((setor) => (
                            <option key={setor.id} value={setor.nome}>
                              {setor.nome}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Setores liberados</Label>
                      <div className="grid gap-2 md:grid-cols-3">
                        {setores.map((setor) => (
                          <label
                            key={setor.id}
                            className="flex items-center gap-2 rounded-lg border border-border bg-background px-3 py-2 text-sm"
                          >
                            <input
                              type="checkbox"
                              checked={
                                formData.perfil === "admin" ||
                                formData.setoresPermitidos.includes(setor.nome)
                              }
                              disabled={formData.perfil === "admin"}
                              onChange={() => toggleSetor(setor.nome)}
                            />
                            {setor.nome}
                          </label>
                        ))}
                      </div>
                      {formData.perfil === "admin" && (
                        <p className="text-xs text-muted-foreground">
                          Administradores recebem acesso a todos os setores ativos.
                        </p>
                      )}
                    </div>

                    <div className="flex gap-2">
                      <Button onClick={handleSave} size="sm">
                        <Check className="mr-2 h-4 w-4" />
                        Salvar permissões
                      </Button>
                      <Button onClick={() => setEditingId(null)} size="sm" variant="outline">
                        <X className="mr-2 h-4 w-4" />
                        Cancelar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                    <div>
                      <div className="font-medium">{usuario.name || usuario.email}</div>
                      <div className="text-sm text-muted-foreground">{usuario.email}</div>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <Badge>{usuario.perfil || "usuario"}</Badge>
                        {usuario.setor && <Badge variant="secondary">{usuario.setor}</Badge>}
                        {setoresUsuario.slice(0, 4).map((setor) => (
                          <Badge key={setor} variant="outline">
                            {setor}
                          </Badge>
                        ))}
                        {setoresUsuario.length > 4 && (
                          <Badge variant="outline">+{setoresUsuario.length - 4}</Badge>
                        )}
                      </div>
                    </div>
                    <Button onClick={() => handleEdit(usuario)} size="sm" variant="outline">
                      <Edit2 className="mr-2 h-4 w-4" />
                      Permissões
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export default function Configuracoes() {
  const [activeSection, setActiveSection] = useState("setores");

  return (
    <div className="mx-auto max-w-7xl p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">{"Configura\u00e7\u00f5es do Sistema"}</h1>
        <p className="mt-1 text-muted-foreground">
          {"Gerencie os cadastros b\u00e1sicos do sistema"}
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
        <aside className="rounded-lg border border-border bg-card p-3 lg:sticky lg:top-6 lg:self-start">
          <nav className="space-y-5">
            {settingsGroups.map((group) => (
              <div key={group.title}>
                <div className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  {group.title}
                </div>
                <div className="space-y-1">
                  {group.items.map((item) => {
                    const isSelected = activeSection === item.key;

                    return (
                      <button
                        key={item.key}
                        type="button"
                        onClick={() => setActiveSection(item.key)}
                        className={
                          "w-full rounded-md px-3 py-2 text-left text-sm font-medium transition " +
                          (isSelected
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "text-foreground hover:bg-muted")
                        }
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </nav>
        </aside>

        <section className="min-w-0">
          {activeSection === "usuarios" ? (
            <UsuariosPermissoes />
          ) : (
            <ConfigList section={activeSection} />
          )}
        </section>
      </div>
    </div>
  );
}
