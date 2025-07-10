'use client';

import {useRef, useState} from "react";
import Form from "@rjsf/daisyui";
import validator from "@rjsf/validator-ajv8";
import {generateSchema} from "@/app/actions/generateSchema";
import {FaLinkedinIn, FaGithub} from "react-icons/fa";

export default function Home() {
    const formRef = useRef<HTMLFormElement>(null);
    const [schema, setSchema] = useState<any>(null);
    const [formData, setFormData] = useState<any>({});

    async function handleAction(formData: FormData) {
        const prompt = formData.get("prompt") as string;
        const schema = await generateSchema(prompt);
        setSchema(schema);
    }

    return (
        <div
            className="grid grid-rows-[20px_1fr_20px] items-center justify-items-center min-h-screen p-8 pb-20 gap-16 sm:p-20 font-[family-name:var(--font-geist-sans)]">
            <main className="flex flex-col gap-[32px] row-start-2 items-center sm:items-start w-xl">
                <h1 className="text-2xl font-bold mb-4 text-center w-full">AI Form Generator</h1>
                <div className="w-full text-center -mt-10">
                    <p className="text-sm text-gray-500">
                        <span className="italic">Ja, dit is stiekem voor m’n sollicitatie bij MoreApp</span> 😏
                    </p>
                </div>
                <form action={handleAction} ref={formRef} className="w-full flex flex-col gap-4">
                    <textarea
                        name="prompt"
                        className="textarea textarea-bordered w-full"
                        rows={3}
                        placeholder="Wat voor formulier moet ik maken?"
                    />
                    <button className="btn btn-outline btn-warning" type="submit">Genereer!</button>
                </form>
                {schema && (
                    <div className="p-8 w-full border-2 border-solid rounded-lg">
                        <Form
                            validator={validator}
                            uiSchema={{
                                "ui:field": "generated-form"
                            }}
                            schema={schema}
                            formData={formData}
                            onChange={(e) => setFormData(e.formData)}
                        />
                    </div>
                )}
            </main>
            <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center">
                <p>Gemaakt door Darryl Amatsetam</p>
                <a
                    className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                    href="https://github.com/praetore"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <FaGithub/>
                    GitHub
                </a>
                <a
                    className="flex items-center gap-2 hover:underline hover:underline-offset-4"
                    href="https://www.linkedin.com/in/praetore/"
                    target="_blank"
                    rel="noopener noreferrer"
                >
                    <FaLinkedinIn/>
                    LinkedIn
                </a>
            </footer>
        </div>
    );
}
