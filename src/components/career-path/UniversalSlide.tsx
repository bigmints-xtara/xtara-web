import { Button } from "@/components/ui/button";
import { motion } from 'framer-motion';
import { CareerSlideData } from '@/types/career';
import { ListVisualization } from './visualizations/ListVisualization';
import { TimelineVisualization } from './visualizations/TimelineVisualization';
import { CarouselVisualization } from './visualizations/CarouselVisualization';
import { BentoVisualization } from './visualizations/BentoVisualization';
import { IntroVisualization } from './visualizations/IntroVisualization';
import * as Icons from 'lucide-react';

interface UniversalSlideProps {
    slideData: CareerSlideData;
    onButtonClick: () => void;
    isLastSlide?: boolean;
}

export default function UniversalSlide({ slideData, onButtonClick, isLastSlide = false }: UniversalSlideProps) {
    const renderIcon = (iconName: string, className: string) => {
        const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
        return <IconComponent className={className} />;
    };

    const renderVisualization = () => {
        switch (slideData.visualization) {
            case 'timeline':
                return <TimelineVisualization data={slideData} />;
            case 'carousel':
                return <CarouselVisualization data={slideData} />;
            case 'bento':
                return <BentoVisualization data={slideData} />;
            case 'intro':
                return <IntroVisualization data={slideData} />;
            case 'list':
            default:
                return <ListVisualization data={slideData} />;
        }
    };

    const isFullWidth = slideData.visualization === 'bento' || 
                        slideData.visualization === 'carousel' ||
                        slideData.visualization === 'intro';
    
    const isIntro = slideData.visualization === 'intro';

    return (
        <div className={`flex flex-col h-full mx-auto px-4 py-8 md:justify-center ${isFullWidth ? 'max-w-7xl' : 'max-w-4xl'}`}>
            {!isIntro && (
                <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center mb-4 md:mb-6"
                >
                    <div className="flex justify-center mb-3">
                        <div className="p-3 rounded-xl bg-white/5 border border-white/10 shadow-xl">
                            {renderIcon(slideData.slideIcon, "w-8 h-8 md:w-10 md:h-10 text-blue-400")}
                        </div>
                    </div>
                    <h2 className="text-2xl md:text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-b from-white to-white/80 mb-2 tracking-tight drop-shadow-md">
                        {slideData.title}
                    </h2>
                    <p className="text-sky-100/80 text-sm md:text-base font-medium max-w-2xl mx-auto leading-relaxed">
                        {slideData.subtitle}
                    </p>
                </motion.div>
            )}

            <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
                {renderVisualization()}
            </div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-4 md:mt-6 w-full max-w-md mx-auto flex-shrink-0"
            >
                <Button
                    className="w-full"
                    variant={isLastSlide ? "secondary" : "default"}
                    onClick={onButtonClick}
                >
                    {slideData.buttonLabel}
                </Button>
            </motion.div>
        </div>
    );
}
