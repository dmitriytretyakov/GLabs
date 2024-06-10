import {Component, inject, OnInit, signal} from '@angular/core';
import {CommonModule} from '@angular/common';
import {RouterOutlet} from '@angular/router';
import {FormBuilder, FormControl, FormGroup, ReactiveFormsModule, Validators} from "@angular/forms";
import {debounceTime, min} from "rxjs";
import {Address} from "@ton/core";
import {Buffer} from "buffer";

type NftItem<AttributesType> = {
    address: string,
    metadata: {
        attributes: AttributesType,
        name: string,
        description: string,
    },
    previews: [
        {
            resolution: '5x5',
            url: string
        },
        {
            resolution: '150x150',
            url: string
        },
        {
            resolution: '500x500',
            url: string
        },
        {
            resolution: '1500x1500',
            url: string
        }
    ]
};

type NftItemResponse<AttributesType> = {
    nft_items: NftItem<AttributesType>[]
};

type GBotAttributes = ({
    "trait_type": "Armor Set",
    "value": "Set 01" | "Set 02" | "Set 03" | "Progenitor"
} |
{
    "trait_type": "Colors",
    "value": "Common" | "Rare"
} |
{
    "trait_type": "Eyes",
    "value": "Emerald" | "Azure" | "Fuchsia" | "Scarlet" | "Golden"
} |
{
    "trait_type": "Head",
    "value": string
} |
{
    "trait_type": "Torso",
    "value": "string"
} |
{
    "trait_type": "Arms Top",
    "value": string
} |
{
    "trait_type": "Arms Bottom",
    "value": string
} |
{
    "trait_type": "Legs Top",
    "value": string
} |
{
    "trait_type": "Legs Bottom",
    "value": string
} |
{
    "trait_type": "Outer Body Type",
    "value": "Plastic" | "ABS" | "Shiny" | "SMMA" | "Golden"
} |
{
    "trait_type": "Inner Body Type",
    "value": "Plastic" | "ABS"
} |
{
    "trait_type": "Elements Type",
    "value": "Plastic" | "Shiny" | "Diamond" | "Golden"
} |
    {
        "trait_type": "mode",
        "value": "concealed"
    })[];


const miningMultipliers = {
    "Armor Set": {
        "Set 01": 2,
        "Set 02": 1.6,
        "Set 03": 2.8,
        "Progenitor": 10,
    },
    "Elements Type": {
        "Diamond": 3.9,
        "Golden": 6.1,
        "Shiny": 2.1
    },
    "Eyes": {
        "Azure": 2.4,
        "Funchia": 2.7,
        "Scarlet": 3.0,
        "Golden": 3.5
    },
    "Inner Body Type": {
        "ABS": 1.5
    },
    "Outer Body Type": {
        "ABS": 1.7,
        "Shiny": 2.5,
        "SMMA": 2.6,
        "Golden": 4.6
    },
    "Colors": {
        "Rare": 1.6
    }
};

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [CommonModule, RouterOutlet, ReactiveFormsModule],
    templateUrl: './app.component.html',
    styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit {
    fb = inject(FormBuilder);
    form: FormGroup;
    bot = signal<NftItem<GBotAttributes> | undefined>(undefined);
    constructor() {
        this.form = this.fb.group({
            query: new FormControl(null, [Validators.required]),
        });
        this.form.get('query')!.valueChanges.pipe(debounceTime(500)).subscribe((query: string) => {
            this.findBot(query);
        });
    }
    ngOnInit() {

    }

    findBot(query: string) {
        const gBotNumber = parseInt(query);
        if(gBotNumber) {
            const collectionAddress = 'EQDgZmQpDJbO6laHvvibaXYXMlEAYEH6LnUtA5J19W18dENp';
            fetch(`https://tonapi.io/v2/nfts/collections/${collectionAddress}/items?limit=1&offset=${gBotNumber - 1}`)
                .then(res => res.json())
                .then((res: NftItemResponse<GBotAttributes>) => {
                    if(res.nft_items[0]) {
                        res.nft_items[0].address = Address.parse(res.nft_items[0].address).toString();
                        this.bot.set(res.nft_items[0]);
                    }
                });
        }
    }

    miningValue() {
        let miningValue = 0;
        const bot = this.bot();
        if(bot && !bot.metadata.attributes.find(x => x.trait_type === 'mode')) {
            miningValue = 500;
            Object.entries(miningMultipliers).forEach(([key, values]) => {
                const attribute = bot.metadata.attributes.find(x => x.trait_type === key);
                if (attribute) {
                    // @ts-ignore
                    const attributeMultiplier = values[attribute.value];
                    if(typeof attributeMultiplier !== 'undefined') {
                        miningValue *= attributeMultiplier;
                    }
                }
            });
        }
        return Math.floor(miningValue);
    }

    preview() {
        return this.bot()!.previews.find(p => p.resolution === '500x500')!.url;
    }
}
