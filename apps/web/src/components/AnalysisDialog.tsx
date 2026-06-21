"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2 } from "lucide-react";

interface AnalysisDialogProps {
  open: boolean;
  onClose: () => void;
  ncId: number;
  onSuccess: () => void;
}

interface Porque {
  pergunta: string;
  resposta: string;
}

interface Categoria {
  categoria: string;
  causa: string;
}

const ISHIKAWA_CATEGORIES = [
  "Mão de Obra",
  "Método",
  "Material",
  "Máquina",
  "Medida",
  "Meio Ambiente"
];

export default function AnalysisDialog({ open, onClose, ncId, onSuccess }: AnalysisDialogProps) {
  const [tipo, setTipo] = useState<"5_porques" | "ishikawa">("5_porques");
  const [responsavel, setResponsavel] = useState("");
  const [conclusao, setConclusao] = useState("");
  const [descricaoGestor, setDescricaoGestor] = useState("");
  const [porques, setPorques] = useState<Porque[]>([
    { pergunta: "Por que o problema ocorreu?", resposta: "" },
  ]);
  const [categorias, setCategorias] = useState<Categoria[]>([
    { categoria: "Mão de Obra", causa: "" }
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setTipo("5_porques");
      setResponsavel("");
      setConclusao("");
      setDescricaoGestor("");
      setPorques([{ pergunta: "Por que o problema ocorreu?", resposta: "" }]);
      setCategorias([{ categoria: "Mão de Obra", causa: "" }]);
    }
  }, [open]);

  const handleAddPorque = () => {
    setPorques([...porques, { pergunta: `Por que ${porques.length}?`, resposta: "" }]);
  };

  const handleRemovePorque = (index: number) => {
    setPorques(porques.filter((_, i) => i !== index));
  };

  const handlePorqueChange = (index: number, field: "pergunta" | "resposta", value: string) => {
    const newPorques = [...porques];
    newPorques[index][field] = value;
    setPorques(newPorques);
  };

  const handleAddCategoria = () => {
    setCategorias([...categorias, { categoria: "Mão de Obra", causa: "" }]);
  };

  const handleRemoveCategoria = (index: number) => {
    setCategorias(categorias.filter((_, i) => i !== index));
  };

  const handleCategoriaChange = (index: number, field: "categoria" | "causa", value: string) => {
    const newCategorias = [...categorias];
    newCategorias[index][field] = value;
    setCategorias(newCategorias);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body: any = {
        tipo,
        responsavel,
        conclusao,
        descricaoGestor,
      };

      if (tipo === "5_porques") {
        body.porques = porques.filter(p => p.resposta.trim() !== "");
      } else {
        body.categorias = categorias.filter(c => c.causa.trim() !== "");
      }

      const response = await fetch(`/api/ncs/${ncId}/analises`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Erro ao salvar análise:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nova Análise de Causa Raiz</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="responsavel">Responsável pela Análise</Label>
              <Input
                id="responsavel"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                required
                placeholder="Nome do responsável"
              />
            </div>

            <Tabs value={tipo} onValueChange={(v) => setTipo(v as "5_porques" | "ishikawa")}>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="5_porques">5 Porquês</TabsTrigger>
                <TabsTrigger value="ishikawa">Ishikawa (6M)</TabsTrigger>
              </TabsList>

              <TabsContent value="5_porques" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  O método dos 5 Porquês ajuda a identificar a causa raiz perguntando "Por quê?" sucessivamente.
                </p>
                
                <div className="space-y-3">
                  {porques.map((porque, index) => (
                    <div key={index} className="space-y-2 p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <Label className="text-sm font-medium">Por quê #{index + 1}</Label>
                        {porques.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemovePorque(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <Input
                        value={porque.pergunta}
                        onChange={(e) => handlePorqueChange(index, "pergunta", e.target.value)}
                        placeholder="Pergunta"
                        className="text-sm"
                      />
                      <Textarea
                        value={porque.resposta}
                        onChange={(e) => handlePorqueChange(index, "resposta", e.target.value)}
                        placeholder="Resposta / Análise"
                        rows={2}
                        required={index === 0}
                      />
                    </div>
                  ))}
                </div>

                {porques.length < 7 && (
                  <Button type="button" variant="outline" onClick={handleAddPorque} className="w-full">
                    <Plus className="w-4 h-4 mr-2" />
                    Adicionar Mais Um "Por quê?"
                  </Button>
                )}
              </TabsContent>

              <TabsContent value="ishikawa" className="space-y-4 mt-4">
                <p className="text-sm text-muted-foreground">
                  O diagrama de Ishikawa (espinha de peixe) organiza as causas em 6 categorias (6M).
                </p>

                <div className="space-y-3">
                  {categorias.map((cat, index) => (
                    <div key={index} className="space-y-2 p-4 border rounded-lg">
                      <div className="flex items-start justify-between">
                        <Label className="text-sm font-medium">Causa #{index + 1}</Label>
                        {categorias.length > 1 && (
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            onClick={() => handleRemoveCategoria(index)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <select
                          value={cat.categoria}
                          onChange={(e) => handleCategoriaChange(index, "categoria", e.target.value)}
                          className="col-span-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                          required
                        >
                          {ISHIKAWA_CATEGORIES.map((c) => (
                            <option key={c} value={c}>{c}</option>
                          ))}
                        </select>
                        <Textarea
                          value={cat.causa}
                          onChange={(e) => handleCategoriaChange(index, "causa", e.target.value)}
                          placeholder="Descreva a causa identificada nesta categoria"
                          rows={2}
                          className="col-span-2"
                          required={index === 0}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                <Button type="button" variant="outline" onClick={handleAddCategoria} className="w-full">
                  <Plus className="w-4 h-4 mr-2" />
                  Adicionar Causa
                </Button>
              </TabsContent>
            </Tabs>

            <div>
              <Label htmlFor="conclusao">Conclusão da Análise</Label>
              <Textarea
                id="conclusao"
                value={conclusao}
                onChange={(e) => setConclusao(e.target.value)}
                placeholder="Resumo das causas raiz identificadas e principais conclusões"
                rows={3}
              />
            </div>

            <div className="p-4 bg-teal-50 border border-teal-200 rounded-lg">
              <Label htmlFor="descricaoGestor" className="text-teal-900">
                Campo para o Gestor (Análise e Aprovação)
              </Label>
              <Textarea
                id="descricaoGestor"
                value={descricaoGestor}
                onChange={(e) => setDescricaoGestor(e.target.value)}
                placeholder="Espaço para o gestor adicionar observações e aprovar a análise..."
                rows={3}
                className="mt-2"
              />
              <p className="text-xs text-teal-700 mt-2">
                Após a visualização e preenchimento pelo gestor, a análise ficará marcada como aprovada.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Análise"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
