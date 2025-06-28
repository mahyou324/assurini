
"use client";

import { useState } from "react";
import { FindContractForm } from "@/components/modify-contract/find-contract-form";
import { ContractModificationDetails } from "@/components/modify-contract/contract-modification-details";
import type { UserContract } from "@/lib/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_NAME } from "@/lib/constants";
import { AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function ModifyContractPage() {
  const [contract, setContract] = useState<UserContract | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isContractFound, setIsContractFound] = useState<boolean>(false);

  const handleContractFound = (foundContract: UserContract) => {
    setContract(foundContract);
    setIsContractFound(true);
    setError(null);
    setIsLoading(false);
  };

  const handleContractNotFound = (message: string) => {
    setContract(null);
    setIsContractFound(false);
    setError(message);
    setIsLoading(false);
  };

  const handleSearchStart = () => {
    setIsLoading(true);
    setError(null);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <Card className="shadow-xl">
        <CardHeader>
          <CardTitle className="text-3xl font-bold text-primary">
            Modifier votre Contrat d'Assurance
          </CardTitle>
          <CardDescription>
            Recherchez votre contrat par son numéro de police pour apporter des modifications.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Erreur</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {!isContractFound ? (
            <FindContractForm 
              onContractFound={handleContractFound} 
              onContractNotFound={handleContractNotFound}
              onSearchStart={handleSearchStart}
              isLoading={isLoading}
            />
          ) : contract ? (
            <ContractModificationDetails 
              contract={contract} 
              onModificationSuccess={() => {
                // Reset the form state to allow searching for another contract
                setIsContractFound(false); 
                setContract(null);
                setError("Votre contrat a été modifié avec succès. Vous pouvez rechercher un autre contrat ou retourner à l'accueil.");
              }}
            />
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
