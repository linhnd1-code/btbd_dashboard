import { Link } from 'react-router-dom';

export default function PlateLink({ plate, style }) {
  if (!plate) return '-';
  return (
    <Link to={`/fleet/xe/${plate}`} className="plate-link" style={style}>
      {plate}
    </Link>
  );
}
