'use client';

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from 'react';
import { QuestionModel, QuestionOption } from '@/lib/types';
import { AssessmentService } from '@/lib/services/assessment';

interface Props {
  questions: QuestionModel[];
  userId: string;
  onComplete: () => void;
}

export default function AssessmentForm({ questions, userId, onComplete }: Props) {
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);

  const currentQuestion = questions[currentStep];

  const handleNext = async () => {
    // Basic validation could go here
    if (currentStep < questions.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      await handleSubmit();
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await AssessmentService.saveAssessmentResults(userId, answers);
      onComplete();
    } catch (error) {
      console.error('Failed to submit assessment:', error);
      alert('Failed to submit. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleAnswerChange = (value: any) => {
    setAnswers(prev => ({ ...prev, [currentQuestion.id]: value }));
  };

  if (!currentQuestion) return <div>Loading...</div>;

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-xl ">
      <div className="mb-6">
        <div className="h-2 bg-gray-100 rounded-full">
          <div 
            className="h-full bg-blue-600 rounded-full transition-all duration-300"
            style={{ width: `${((currentStep + 1) / questions.length) * 100}%` }}
          />
        </div>
        <p className="text-sm text-gray-500 mt-2">
          Question {currentStep + 1} of {questions.length}
        </p>
      </div>

      <h2 className="text-2xl font-bold mb-4">{currentQuestion.label}</h2>
      {currentQuestion.description && (
        <p className="text-gray-600 mb-6">{currentQuestion.description}</p>
      )}

      <div className="space-y-4">
        {renderInput(currentQuestion, answers[currentQuestion.id], handleAnswerChange)}
      </div>

      <div className="mt-8 flex justify-end">
        <Button
          onClick={handleNext}
          disabled={loading}
        >
          {loading ? 'Saving...' : currentStep === questions.length - 1 ? 'Finish' : 'Next'}
        </Button>
      </div>
    </div>
  );
}

function renderInput(question: QuestionModel, value: any, onChange: (val: any) => void) {
  switch (question.type) {
    case 'text':
      return (
        <Input
          type="text"
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          className="w-full"
          placeholder="Type your answer..."
 />
      );
    case 'singleSelect':
      return (
        <div className="space-y-2">
          {question.options?.map(opt => (
            <Button variant="surface"
              key={opt.id}
              onClick={() => onChange(opt.id)}
              className={`w-full p-4 text-left border rounded-lg transition-colors ${
                value === opt.id ? 'border-blue-500 bg-blue-50' : 'hover:bg-gray-50'
              }`}
            >
              <div className="font-medium">{opt.label}</div>
              {opt.description && (
                <div className="text-sm text-gray-500">{opt.description}</div>
              )}
            </Button>
          ))}
        </div>
      );
    default:
      return <div>Unsupported question type: {question.type}</div>;
  }
}
