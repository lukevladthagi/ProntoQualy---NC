"use client";

import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";

interface VerificationDialogProps {
  open: boolean;
  onClose: () => void;
  ncId: number;
  onSuccess: () => void;
}

export default function VerificationDialog({ open, onClose, ncId, onSuccess }: VerificationDialogProps) {
  const [responsavel, setResponsavel] = useState("");
  const [descricao, setDescricao] = useState("");
  const [eficaz, setEficaz] = useState<"sim" | "nao" | "acoes_em_andamento">("sim");
  const [observacoes, setObservacoes] = useState("");
  const [motivoReabrir, setMotivoReabrir] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) {
      // Reset form when dialog closes
      setResponsavel("");
      setDescricao("");
      setEficaz("sim");
      setObservacoes("");
      setMotivoReabrir("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const body: any = {
        responsavel,
        descricao,
        eficaz: eficaz === "sim",
        observacoes: observacoes || undefined,
      };

      if (eficaz === "nao") {
        body.motivoReabrir = motivoReabrir || undefined;
      }

      const response = await fetch(`/api/ncs/${ncId}/verificacoes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (response.ok) {
        onSuccess();
        onClose();
      }
    } catch (error) {
      console.error("Erro ao salvar verificação:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Nova Verificação de Eficácia</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="responsavel">Responsável pela Verificação</Label>
              <Input
                id="responsavel"
                value={responsavel}
                onChange={(e) => setResponsavel(e.target.value)}
                required
                placeholder="Nome do responsável"
              />
            </div>

            <div>
              <Label htmlFor="descricao">Descrição da Verificação</Label>
              <Textarea
                id="descricao"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
                placeholder="Descreva o que foi verificado e os critérios utilizados"
                rows={3}
                required
              />
            </div>

            <div>
              <Label className="mb-3 block">As ações implementadas foram eficazes?</Label>
              <RadioGroup value={eficaz} onValueChange={(v) => setEficaz(v as "sim" | "nao" | "acoes_em_andamento")}>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="sim" id="eficaz-sim" />
                  <Label htmlFor="eficaz-sim" className="font-normal cursor-pointer">
                    Sim - As ações resolveram o problema (NC será encerrada)
                  </Label>
                </div>
                <div className="flex items-center space-x-2 mb-2">
                  <RadioGroupItem value="nao" id="eficaz-nao" />
                  <Label htmlFor="eficaz-nao" className="font-normal cursor-pointer">
                    Não - O problema persiste ou voltou a ocorrer (NC será reaberta)
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="acoes_em_andamento" id="eficaz-acoes" />
                  <Label htmlFor="eficaz-acoes" className="font-normal cursor-pointer">
                    O problema se repete porém já existem ações em andamento para essa finalidade
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {eficaz === "nao" && (
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                <Label htmlFor="motivoReabrir">Motivo para Reabertura da NC</Label>
                <Textarea
                  id="motivoReabrir"
                  value={motivoReabrir}
                  onChange={(e) => setMotivoReabrir(e.target.value)}
                  placeholder="Explique por que as ações não foram eficazes e o que foi observado"
                  rows={3}
                  className="mt-2"
                  required
                />
              </div>
            )}

            <div>
              <Label htmlFor="observacoes">Observações Adicionais (opcional)</Label>
              <Textarea
                id="observacoes"
                value={observacoes}
                onChange={(e) => setObservacoes(e.target.value)}
                placeholder="Comentários, evidências encontradas, recomendações..."
                rows={2}
              />
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Salvando..." : "Salvar Verificação"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
