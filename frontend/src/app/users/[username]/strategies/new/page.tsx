"use client";

import { useState } from "react";
import { notFound, useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getSession, useSession } from "next-auth/react";

export default function NewStrategyPage() {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [engine, setEngine] = useState("LEAN");
  const router = useRouter();

  const { data: session } = useSession();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const res = await fetch("/api/strategies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description, engine }),
    });

    if (res.ok) {
      router.push(`/users/${session?.user?.name}/strategies`);
    } else {
      alert("Failed to create strategy");
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 space-y-6">
      <h1 className="text-2xl font-bold">Create New Strategy</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Description</Label>
          <Input
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
          />
        </div>

        <div>
          <Label>Engine</Label>
          <Select
            value={engine}
            onValueChange={(value) =>
              setEngine(value as "LEAN" | "BACKTESTING")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select engine" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="LEAN">LEAN</SelectItem>
              <SelectItem value="BACKTESTING">BACKTESTING</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button type="submit">Create Strategy</Button>
      </form>
    </div>
  );
}
