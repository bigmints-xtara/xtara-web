"use client";

import { useMemo, useState } from "react";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { updateMultiSelectSelection } from "@/lib/assessment-selection";
import { getVisibleAssessmentQuestions, validateAssessmentAnswer } from "@/modules/assessment";
import type {
    AssessmentAnswer,
    AssessmentAnswers,
    Question,
} from "@/types/assessment";

interface AssessmentEngineProps {
    questions: Question[];
    onComplete: (answers: AssessmentAnswers) => void;
    isRetake?: boolean;
    initialAnswers?: AssessmentAnswers;
    onAnswersChange?: (answers: AssessmentAnswers) => void;
    labels?: AssessmentEngineLabels;
}

export interface AssessmentEngineLabels {
    stepOf: string;
    back: string;
    next: string;
    finish: string;
    chooseUpTo: string;
    noQuestions: string;
    textPlaceholder: string;
    chooseGrade: string;
}

const defaultLabels: AssessmentEngineLabels = {
    stepOf: "Step {current} of {total}",
    back: "Back",
    next: "Next",
    finish: "See my exploration map",
    chooseUpTo: "Choose up to {count}",
    noQuestions: "No questions are available for this journey.",
    textPlaceholder: "Type your answer here",
    chooseGrade: "First, choose your grade",
};

export default function AssessmentEngine({
    questions,
    onComplete,
    isRetake = false,
    initialAnswers = {},
    onAnswersChange,
    labels = defaultLabels,
}: AssessmentEngineProps) {
    const [currentIndex, setCurrentIndex] = useState(() => {
        const initialVisibleQuestions = getVisibleAssessmentQuestions(questions, initialAnswers, isRetake);
        const firstIncomplete = initialVisibleQuestions.findIndex(
            (question) => !validateAssessmentAnswer(question, initialAnswers[question.id]),
        );
        return firstIncomplete === -1
            ? Math.max(initialVisibleQuestions.length - 1, 0)
            : firstIncomplete;
    });
    const [answers, setAnswers] = useState<AssessmentAnswers>(initialAnswers);

    const visibleQuestions = useMemo(
        () => getVisibleAssessmentQuestions(questions, answers, isRetake),
        [answers, isRetake, questions],
    );

    const safeIndex = Math.min(currentIndex, Math.max(visibleQuestions.length - 1, 0));
    const currentQuestion = visibleQuestions[safeIndex];

    const handleAnswer = (value: AssessmentAnswer) => {
        if (!currentQuestion) return;
        const nextAnswers = { ...answers, [currentQuestion.id]: value };
        setAnswers(nextAnswers);
        onAnswersChange?.(nextAnswers);
    };

    if (!currentQuestion) {
        return <div className="py-16 text-center text-sm text-slate-600">{labels.noQuestions}</div>;
    }

    const currentAnswer = answers[currentQuestion.id];
    const selectingStage = currentQuestion.id === "currentGrade" && visibleQuestions.length === 1;
    const progress = selectingStage ? 0 : ((safeIndex + 1) / visibleQuestions.length) * 100;

    const handleNext = () => {
        if (safeIndex < visibleQuestions.length - 1) {
            setCurrentIndex(safeIndex + 1);
            window.scrollTo({ top: 0, behavior: "smooth" });
            return;
        }
        onComplete(answers);
    };

    return (
        <div className="mx-auto max-w-2xl px-4 pb-28 sm:px-6">
            <div className="mb-5 sm:mb-7">
                <div className="flex items-center justify-between text-xs font-medium text-slate-500">
                    <span>{selectingStage ? labels.chooseGrade : formatLabel(labels.stepOf, { current: safeIndex + 1, total: visibleQuestions.length })}</span>
                    <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="mt-2 h-2" />
            </div>

            <div className="rounded-2xl border border-primary/10 bg-white p-5 shadow-sm sm:p-7">
                <h1 className="text-xl font-semibold leading-tight text-primary sm:text-2xl">{currentQuestion.label}</h1>
                {currentQuestion.description ? (
                    <p className="mt-3 text-sm leading-6 text-slate-600">{currentQuestion.description}</p>
                ) : null}

                <div className="mt-7">
                    <QuestionInput question={currentQuestion} value={currentAnswer} onChange={handleAnswer} labels={labels} />
                </div>
            </div>

            <div className="fixed inset-x-0 bottom-0 z-40 border-t border-gray-200 bg-white/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur">
                <div className="mx-auto flex max-w-2xl items-center gap-3">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setCurrentIndex(Math.max(0, safeIndex - 1))}
                        disabled={safeIndex === 0}
                        className="min-h-12 shrink-0 rounded-xl px-4"
                    >
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        {labels.back}
                    </Button>
                    <Button
                        type="button"
                        onClick={handleNext}
                        disabled={!validateAssessmentAnswer(currentQuestion, currentAnswer)}
                        className="ml-auto min-h-12 rounded-xl px-5"
                        size="lg"
                    >
                        {safeIndex === visibleQuestions.length - 1 && !selectingStage ? labels.finish : labels.next}
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </div>
            </div>
        </div>
    );
}

function QuestionInput({
    question,
    value,
    onChange,
    labels,
}: {
    question: Question;
    value: AssessmentAnswer;
    onChange: (value: AssessmentAnswer) => void;
    labels: AssessmentEngineLabels;
}) {
    if (question.fieldType === "text") {
        return (
            <Input
                type="text"
                placeholder={labels.textPlaceholder}
                value={typeof value === "string" ? value : ""}
                onChange={(event) => onChange(event.target.value)}
            />
        );
    }

    if (question.fieldType === "number") {
        return (
            <Input
                type="number"
                value={typeof value === "number" ? value : ""}
                onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
            />
        );
    }

    if (question.fieldType === "singleSelect") {
        return (
            <div className="space-y-3" role="radiogroup" aria-label={question.label}>
                {question.options?.map((option) => {
                    const selected = value === option.id;
                    return (
                        <button
                            type="button"
                            key={option.id}
                            role="radio"
                            aria-checked={selected}
                            onClick={() => onChange(option.id)}
                            className={`flex min-h-12 w-full items-start justify-between rounded-xl border px-4 py-3 text-left transition ${
                                selected
                                    ? "border-primary bg-primary/5 text-primary"
                                    : "border-slate-200 bg-white text-slate-700 hover:border-primary/40"
                            }`}
                        >
                            <span className="min-w-0 pr-3">
                                <span className="font-medium">{option.label}</span>
                                {option.description ? <span className="mt-1 block text-sm opacity-75">{option.description}</span> : null}
                            </span>
                            <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${selected ? "bg-primary text-white" : "border border-slate-300"}`}>
                                {selected ? <Check size={12} /> : null}
                            </span>
                        </button>
                    );
                })}
            </div>
        );
    }

    if (question.fieldType === "multiSelect") {
        const selectedValues = Array.isArray(value) ? value : [];
        const max = question.validation?.maxSelect;
        return (
            <div>
                {max ? <p className="mb-3 text-xs font-medium text-slate-500">{formatLabel(labels.chooseUpTo, { count: max })}</p> : null}
                <div className="space-y-3" role="group" aria-label={question.label}>
                    {question.options?.map((option) => {
                        const selected = selectedValues.includes(option.id);
                        const exclusive = option.metadata?.exclusive === true;
                        const disabled = !selected && !exclusive && max !== undefined && selectedValues.length >= max;
                        return (
                            <button
                                type="button"
                                key={option.id}
                                role="checkbox"
                                aria-checked={selected}
                                disabled={disabled}
                                onClick={() => onChange(updateMultiSelectSelection(question, selectedValues, option.id))}
                                className={`flex min-h-12 w-full items-start justify-between rounded-xl border px-4 py-3 text-left transition disabled:cursor-not-allowed disabled:opacity-45 ${
                                    selected
                                        ? "border-primary bg-primary/5 text-primary"
                                        : "border-slate-200 bg-white text-slate-700 hover:border-primary/40"
                                }`}
                            >
                                <span className="min-w-0 pr-3">
                                    <span className="font-medium">{option.label}</span>
                                    {option.description ? <span className="mt-1 block text-sm opacity-75">{option.description}</span> : null}
                                </span>
                                <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded ${selected ? "bg-primary text-white" : "border border-slate-300"}`}>
                                    {selected ? <Check size={12} /> : null}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        );
    }

    if (question.fieldType === "slider") {
        const numericValue = typeof value === "number" ? value : question.validation?.minValue ?? 0;
        return (
            <div className="py-4">
                <input
                    type="range"
                    min={question.validation?.minValue ?? 0}
                    max={question.validation?.maxValue ?? 100}
                    className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-gray-200 accent-primary"
                    value={numericValue}
                    onChange={(event) => onChange(Number(event.target.value))}
                />
                <div className="mt-3 text-center text-xl font-semibold text-primary">{numericValue}</div>
            </div>
        );
    }

    return <div className="text-sm text-red-600">Unsupported question type: {question.fieldType}</div>;
}

function formatLabel(template: string, values: Record<string, string | number>): string {
    return Object.entries(values).reduce(
        (result, [key, value]) => result.replaceAll(`{${key}}`, String(value)),
        template,
    );
}
