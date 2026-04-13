import React from 'react';
import { getLoanProgramDisplayLabel } from '@/utils/programType';

const ProgramItem = ({ program }) => {
  return (
    <div className="flex items-center justify-between py-2.5">
      <div className="flex items-center">
        <div className={`h-2.5 w-2.5 rounded-full mr-2 ${program.isAvailableToBorrower ? 'bg-green-500' : 'bg-gray-300'}`}></div>
        <span className="text-sm text-gray-900 font-medium">
          {getLoanProgramDisplayLabel(program)}
        </span>
      </div>
      <div className="text-xs text-gray-500">
        {program.programType && (
          <span className="capitalize">{program.programType}</span>
        )}
        {program.loanTerm && (
          <span> · {program.loanTerm}yr</span>
        )}
      </div>
    </div>
  );
};

export default ProgramItem;
