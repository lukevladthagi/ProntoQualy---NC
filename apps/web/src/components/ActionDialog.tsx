"use client";

import { useState, useEffect } from "react";
import { Calendar, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PlanoAcao {
  id: number;
  nc_id: number;
  descricao: string;
  tipo: "corretiva" | "preventiva";
  responsavel: string;
  prazo: string;
  status: "pendente" | "em_execucao" | "concluida" | "atrasada";
  observacoes?: string;
  data_conclusao?: string;
}

interface ActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ncId: number;
  action?: PlanoAcao;
  onSuccess: () => void;
}

export default function ActionDialog({
  open,
  onOpenChange,
  ncId,
  action,
  onSuccess,
}: ActionDialogProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    descricao: "",
    tipo: "corretiva" as "corretiva" | "preventiva",
    responsavel: "",
    prazo: "",
    status: "pendente" as "pendente" | "em_execucao" | "concluida" | "atrasada",
    observacoes: "",
  });

  useEffect(() => {
    if (action) {
      setFormData({
        descricao: action.descricao,
        tipo: action.tipo,
        responsavel: action.responsavel,
        prazo: action.prazo.split("T")[0],
        status: action.status,
        observacoes: action.observacoes || "",
      });
    } else {
      setFormData({
        descricao: "",
        tipo: "corretiva",
        responsavel: "",
        prazo: "",
        status: "pendente",
        observacoes: "",
      });
    }
  }, [action, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = action
        ? `/api/planos-acao/${action.id}`
        : `/api/ncs/${ncId}/planos-acao`;
      
      const method = action ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar ação");
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Error saving action:", error);
      alert("Erro ao salvar ação");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {action ? "Editar Ação" : "Nova Ação CAPA"}
          </DialogTitle>
          <DialogDescription>
            {action
              ? "Atualize as informações da ação corretiva ou preventiva"
              : "Adicione uma nova ação corretiva ou preventiva ao plano de ação"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="tipo">Tipo de Ação</Label>
            <Select
              value={formData.tipo}
              onValueChange={(value) =>
                setFormData({ ...formData, tipo: value as "corretiva" | "preventiva" })
              }
            >
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="corretiva">Corretiva</SelectItem>
                <SelectItem value="preventiva">Preventiva</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="descricao">Descrição da Ação *</Label>
            <Textarea
              id="descricao"
              placeholder="Descreva a ação a ser realizada..."
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              rows={4}
              required
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="responsavel">Responsável *</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="responsavel"
                  placeholder="Nome do responsável"
                  value={formData.responsavel}
                  onChange={(e) =>
                    setFormData({ ...formData, responsavel: e.target.value })
                  }
                  className="pl-9"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="prazo">Prazo *</Label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  id="prazo"
                  type="date"
                  value={formData.prazo}
                  onChange={(e) =>
                    setFormData({ ...formData, prazo: e.target.value })
                  }
                  className="pl-9"
                  required
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Status</Label>
            <Select
              value={formData.status}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  status: value as "pendente" | "em_execucao" | "concluida" | "atrasada",
                })
              }
            >
              <SelectTrigger id="status">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pendente">Pendente</SelectItem>
                <SelectItem value="em_execucao">Em Execução</SelectItem>
                <SelectItem value="concluida">Concluída</SelectItem>
                <SelectItem value="atrasada">Atrasada</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="observacoes">Observações</Label>
            <Textarea
              id="observacoes"
              placeholder="Observações adicionais (opcional)"
              value={formData.observacoes}
              onChange={(e) =>
                setFormData({ ...formData, observacoes: e.target.value })
              }
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : action ? "Atualizar" : "Adicionar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
