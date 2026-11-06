import RecordCard from "./RecordCard";
import type { RegistroResumen } from "../../types/records";

interface RecordListProps {
  registros: RegistroResumen[];
}

export default function RecordList({ registros }: RecordListProps) {
  return (
    <ul className="record-list" aria-label="Registros guardados localmente">
      {registros.map((registro) => (
        <li key={registro.id}>
          <RecordCard registro={registro} />
        </li>
      ))}
    </ul>
  );
}
