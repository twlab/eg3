import { default as React } from 'react';
import { default as Gene } from '../../../models/Gene';
/**
 * Box that contains gene details when a gene annotation is clicked.
 *
 * @author Silas Hsu
 */
interface GeneDetailProps {
    gene: Gene;
    collectionName: string;
    queryEndpoint?: Record<string, any>;
}
/**
 * Box that contains gene details when a gene annotation is clicked.
 *
 * @author Silas Hsu
 */
declare const GeneDetail: React.FC<GeneDetailProps>;
export default GeneDetail;
