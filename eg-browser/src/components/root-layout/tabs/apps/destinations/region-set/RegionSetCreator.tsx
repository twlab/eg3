import { useState } from "react";
import StepAccordion from "@/components/ui/step-accordion/StepAccordion";
import { PlusIcon, TrashIcon } from "@heroicons/react/24/solid";
import Button from "@/components/ui/button/Button";
import { motion, AnimatePresence } from "framer-motion";
import { generateUUID } from "wuepgg3-track";
type RegionSetStep = "name" | "elements";

interface IRegionElement {
    id: string;
    name: string;
}

interface NameStepProps {
    name: string;
    setName: (name: string) => void;
}

interface ElementsStepProps {
    elements: IRegionElement[];
    onAddElement: () => void;
    onRemoveElement: (id: string) => void;
    onElementNameChange: (id: string, newName: string) => void;
}

function NameStep({ name, setName }: NameStepProps) {
    return (
        <div className="py-4">
            <label className="block text-sm font-medium text-gray-700">
                Region Set Name
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Enter name..."
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
            </label>
        </div>
    );
}

function ElementsStep({ elements, onAddElement, onRemoveElement, onElementNameChange }: ElementsStepProps) {
    return (
        <div className="py-4 space-y-4">
            <div>
                <AnimatePresence initial={false}>
                    {elements.map((element) => (
                        <motion.div
                            key={element.id}
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 500, damping: 30 }}
                            className="overflow-hidden mb-2"
                        >
                            <motion.div
                                initial={{ x: -20 }}
                                animate={{ x: 0 }}
                                className="flex items-center gap-2"
                            >
                                <input
                                    type="text"
                                    value={element.name}
                                    onChange={(e) => onElementNameChange(element.id, e.target.value)}
                                    placeholder="Enter element name..."
                                    className="flex-1 rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                                />
                                <button
                                    onClick={() => onRemoveElement(element.id)}
                                    className="p-2 text-primary"
                                >
                                    <TrashIcon className="w-5 h-5" />
                                </button>
                            </motion.div>
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            <Button onClick={onAddElement} active>
                Add Element
            </Button>
        </div>
    );
}

export default function RegionSetCreator() {
    const [name, setName] = useState<string>("");
    const [elements, setElements] = useState<IRegionElement[]>([
        { id: generateUUID(), name: "CYP4A22" },
        { id: generateUUID(), name: "chr10:96796528-96829254" },
        { id: generateUUID(), name: "CYP2A6" },
        { id: generateUUID(), name: "CYP3A4" },
        { id: generateUUID(), name: "chr1:47223509-47276522" },
        { id: generateUUID(), name: "CYP1A2" }
    ]);
    const [selectedStep, setSelectedStep] = useState<RegionSetStep | null>("name");

    const handleAddElement = () => {
        const newElement: IRegionElement = {
            id: generateUUID(),
            name: ""
        };
        setElements([...elements, newElement]);
    };

    const handleRemoveElement = (id: string) => {
        setElements(elements.filter(element => element.id !== id));
    };

    const handleElementNameChange = (id: string, newName: string) => {
        setElements(elements.map(element =>
            element.id === id ? { ...element, name: newName } : element
        ));
    };

    const steps = [
        {
            label: "Set Name",
            value: "name" as const,
            valuePreview: name || undefined,
            component: <NameStep name={name} setName={setName} />
        },
        {
            label: "Enter Elements",
            value: "elements" as const,
            valuePreview: elements.length > 0 ? `${elements.length} elements` : undefined,
            component: <ElementsStep
                elements={elements}
                onAddElement={handleAddElement}
                onRemoveElement={handleRemoveElement}
                onElementNameChange={handleElementNameChange}
            />
        }
    ];

    return (
        <StepAccordion
            items={steps}
            selectedItem={selectedStep}
            onSelectedItemChange={setSelectedStep}
        />
    );
}
