"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface NSPAnalysisDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  ncId: number;
  onSuccess: () => void;
}

export default function NSPAnalysisDialog({
  open,
  onOpenChange,
  ncId,
  onSuccess,
}: NSPAnalysisDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    grauDano: "",
    metaSeguranca: "",
    eventoIdentificadoEvolucao: "",
    necessitaAnaliseCausa: "",
    necessitaPlanoAcao: "",
    observacoes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/ncs/${ncId}/nsp-analysis`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          grauDano: formData.grauDano || null,
          metaSeguranca: formData.metaSeguranca || null,
          eventoIdentificadoEvolucao: formData.eventoIdentificadoEvolucao === "sim",
          necessitaAnaliseCausa: formData.necessitaAnaliseCausa === "sim",
          necessitaPlanoAcao: formData.necessitaPlanoAcao === "sim",
        }),
      });

      if (!response.ok) throw new Error("Erro ao salvar análise NSP");

      onSuccess();
      onOpenChange(false);
      setFormData({
        grauDano: "",
        metaSeguranca: "",
        eventoIdentificadoEvolucao: "",
        necessitaAnaliseCausa: "",
        necessitaPlanoAcao: "",
        observacoes: "",
      });
    } catch (error) {
      console.error("Error saving NSP analysis:", error);
      alert("Erro ao salvar análise NSP");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Análise de Segurança do Paciente</DialogTitle>
          <DialogDescription>
            Avalie o grau de dano e a meta de segurança relacionada ao evento
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Grau do Dano</Label>
            <Select
              value={formData.grauDano}
              onValueChange={(value) => setFormData({ ...formData, grauDano: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o grau do dano" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="incidente_sem_lesao">Incidente sem lesão</SelectItem>
                <SelectItem value="leve">Leve</SelectItem>
                <SelectItem value="moderado">Moderado</SelectItem>
                <SelectItem value="grave">Grave</SelectItem>
                <SelectItem value="obito">Óbito</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Meta de Segurança</Label>
            <Select
              value={formData.metaSeguranca}
              onValueChange={(value) => setFormData({ ...formData, metaSeguranca: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione a meta de segurança" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1_identificacao">1. Identificação</SelectItem>
                <SelectItem value="2_comunicacao">2. Comunicação</SelectItem>
                <SelectItem value="3_medicacao">3. Medicação</SelectItem>
                <SelectItem value="4_procedimento_seguro">4. Procedimento seguro</SelectItem>
                <SelectItem value="5_risco_infeccao">5. Risco de infecção</SelectItem>
                <SelectItem value="6_queda_lpp">6. Queda e LPP</SelectItem>
                <SelectItem value="nao_aplica">Não se aplica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Evento identificado na evolução?</Label>
            <Select
              value={formData.eventoIdentificadoEvolucao}
              onValueChange={(value) =>
                setFormData({ ...formData, eventoIdentificadoEvolucao: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Importante esse destaque para as coordenações
            </p>
          </div>

          <div className="space-y-2">
            <Label>Evento necessita de análise das causas?</Label>
            <Select
              value={formData.necessitaAnaliseCausa}
              onValueChange={(value) =>
                setFormData({ ...formData, necessitaAnaliseCausa: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Evento necessita de plano de ação?</Label>
            <Select
              value={formData.necessitaPlanoAcao}
              onValueChange={(value) =>
                setFormData({ ...formData, necessitaPlanoAcao: value })
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="sim">Sim</SelectItem>
                <SelectItem value="nao">Não</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm space-y-1">
            <p className="font-medium text-amber-900">Matriz de Priorização (SLA)</p>
            <ul className="text-amber-800 space-y-0.5 text-xs">
              <li>• Leve: 15 dias</li>
              <li>• Moderado: 7 dias</li>
              <li>• Grave ou óbito: 3 dias</li>
              <li>• Não conformidades e incidentes sem lesão: 20 dias</li>
            </ul>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
