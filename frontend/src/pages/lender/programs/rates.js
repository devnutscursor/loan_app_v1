import React from "react";
import ProtectedRoute from "@/components/auth/ProtectedRoute";
import MainLayout from "@/components/layout/MainLayout";
import { useLenderRates } from "@/hooks/lender/useLenderRates";
import RatesHeader from "@/components/lender/rates/RatesHeader";
import RatesLoadingSkeleton from "@/components/lender/rates/RatesLoadingSkeleton";
import RatesErrorState from "@/components/lender/rates/RatesErrorState";
import RatesGrid from "@/components/lender/rates/RatesGrid";

export default function ManageRates() {
  const {
    rates,
    loading,
    saving,
    error,
    lastUpdated,
    handleRateChange,
    handleSaveRates
  } = useLenderRates();

  return (
    <ProtectedRoute allowedRoles={["lender"]}>
      <MainLayout>
        <div className="py-8 px-0 sm:px-6 lg:px-8 max-w-7xl mx-auto">
          <RatesHeader 
            saving={saving} 
            loading={loading} 
            onSaveRates={handleSaveRates} 
          />

          {loading ? (
            <RatesLoadingSkeleton />
          ) : error ? (
            <RatesErrorState error={error} />
          ) : (
            <RatesGrid rates={rates} saving={saving} />
          )}
        </div>
      </MainLayout>
    </ProtectedRoute>
  );
}
