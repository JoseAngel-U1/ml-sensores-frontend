import RecordCard from "./RecordCard";
import type { AccionesRegistro } from "./RecordCard";
import type { RegistroResumen } from "../../types/records";

interface RecordListProps {
  registros: RegistroResumen[];
  acciones?: AccionesRegistro;
}

export default function RecordList({ registros, acciones }: RecordListProps) {
  return (
    <ul className="record-list" aria-label="Registros guardados localmente">
      {registros.map((registro) => (
        <li key={registro.id}>
          <RecordCard registro={registro} acciones={acciones} />
        </li>
      ))}
    </ul>
  );
}
