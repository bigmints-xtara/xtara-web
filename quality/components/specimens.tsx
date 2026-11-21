import { NativeSelect } from "@/components/ui/native-select";
import { useState } from "react";
import { createRoot } from "react-dom/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import Skeleton, { SkeletonText } from "@/components/ui/Skeleton";
import Carousel from "@/components/ui/Carousel";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Field, FieldLabel, FieldDescription } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function Demo({ name }: { name: string }) {
  const [saved, setSaved] = useState(false);
  switch (name) {
    case "button":
      return (
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={() => setSaved(!saved)}>
            {saved ? "Saved" : "Save career"}
          </Button>
          <Button variant="outline" onClick={() => setSaved(false)}>
            Reset
          </Button>
          <Button disabled>Continue</Button>
          <Button variant="surface" aria-pressed={saved} onClick={() => setSaved(!saved)}>
            {saved ? "Selected direction" : "Select direction"}
          </Button>
        </div>
      );
    case "card":
      return (
        <Card>
          <CardHeader>
            <CardTitle>Design &amp; discovery</CardTitle>
            <CardDescription>Career direction</CardDescription>
          </CardHeader>
          <CardContent>
            Explore work that connects people and ideas.
          </CardContent>
        </Card>
      );
    case "badge":
      return (
        <div className="flex flex-wrap gap-2">
          <Badge>Selected</Badge>
          <Badge variant="secondary">In progress</Badge>
          <Badge variant="outline">Draft</Badge>
        </div>
      );
    case "Skeleton":
      return (
        <div aria-label="Loading reading material">
          <Skeleton height="46px" />
          <div className="mt-4">
            <SkeletonText lines={2} />
          </div>
        </div>
      );
    case "Carousel":
      return (
        <Carousel itemWidth={165}>
          {["Design", "Science", "Technology", "Health"].map((name) => (
            <Card className="min-w-40 px-4" key={name}>
              {name}
            </Card>
          ))}
        </Carousel>
      );
    case "avatar":
      return (
        <Avatar>
          <AvatarFallback>AK</AvatarFallback>
        </Avatar>
      );
    case "dropdown-menu":
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              {saved ? "Career saved" : "Career actions"}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onSelect={() => setSaved(true)}>
              Save career
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => setSaved(false)}>
              Remove from saved
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      );
    case "field":
      return (
        <Field>
          <FieldLabel htmlFor="goal">Learning goal</FieldLabel>
          <Input id="goal" aria-describedby="hint" />
          <FieldDescription id="hint">
            Choose one thing to work on this week.
          </FieldDescription>
        </Field>
      );
    case "input":
      return (
        <div className="grid gap-4">
          <Input aria-label="Search careers" placeholder="Search careers" />
          <label><Input type="checkbox" /> Include saved careers</label>
          <label>Interest level <Input type="range" min={0} max={10} /></label>
        </div>
      );
    case "label":
      return (
        <Field>
          <Label htmlFor="name">Preferred name</Label>
          <Input id="name" />
        </Field>
      );
    case "textarea":
      return (
        <Textarea
          aria-label="Your reflection"
          placeholder="What did you learn?"
        />
      );
    case "native-select":
      return (
        <div className="grid gap-4">
          <NativeSelect defaultValue="design" aria-label="Career direction">
            <option value="design">Design</option><option value="science">Science</option>
          </NativeSelect>
          <NativeSelect multiple defaultValue={["science"]} aria-label="Subjects">
            <option value="design">Design</option><option value="science">Science</option>
          </NativeSelect>
        </div>
      );
    case "select":
      return (
        <Select defaultValue="design">
          <SelectTrigger aria-label="Career direction">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="design">Design</SelectItem>
            <SelectItem value="science">Science</SelectItem>
          </SelectContent>
        </Select>
      );
    case "progress":
      return (
        <div>
          <p className="mb-3 text-sm">Weekly goal · 60%</p>
          <Progress value={60} aria-label="Weekly goal" aria-valuenow={60} />
        </div>
      );
    case "separator":
      return (
        <div>
          Career overview
          <Separator className="my-3" />
          Study options
        </div>
      );
    case "table":
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Direction</TableHead>
              <TableHead>Progress</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell>Design</TableCell>
              <TableCell>In progress</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>Science</TableCell>
              <TableCell>Ready</TableCell>
            </TableRow>
          </TableBody>
        </Table>
      );
    default:
      throw Error("Unknown specimen " + name);
  }
}
const name = new URLSearchParams(location.search).get("component") || "button";
createRoot(document.getElementById("specimen")!).render(<Demo name={name} />);
