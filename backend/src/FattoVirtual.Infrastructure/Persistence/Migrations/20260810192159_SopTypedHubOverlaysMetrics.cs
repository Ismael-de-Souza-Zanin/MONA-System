using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FattoVirtual.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class SopTypedHubOverlaysMetrics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ActionKind",
                table: "SopSteps",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "ActionLabel",
                table: "SopSteps",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ActionPath",
                table: "SopSteps",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ApplicableArea",
                table: "Sops",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "DefaultResponsible",
                table: "Sops",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsTemplate",
                table: "Sops",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "PackKey",
                table: "Sops",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProcedureType",
                table: "Sops",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "ServiceItemId",
                table: "Sops",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "SituationAliases",
                table: "Sops",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "SituationSearch",
                table: "Sops",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "SlaBusinessDays",
                table: "Sops",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TriggerDescription",
                table: "Sops",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<Guid>(
                name: "AgendaEventId",
                table: "SopRuns",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "DelayNotes",
                table: "SopRuns",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ServiceItemId",
                table: "SopRuns",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "TodoItemId",
                table: "SopRuns",
                type: "uuid",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "WasDelayed",
                table: "SopRuns",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "SopOverlays",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "uuid", nullable: false),
                    SopId = table.Column<Guid>(type: "uuid", nullable: false),
                    ClientId = table.Column<Guid>(type: "uuid", nullable: true),
                    ServiceItemId = table.Column<Guid>(type: "uuid", nullable: true),
                    Kind = table.Column<string>(type: "text", nullable: false),
                    Title = table.Column<string>(type: "text", nullable: false),
                    Body = table.Column<string>(type: "text", nullable: false),
                    SortOrder = table.Column<int>(type: "integer", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_SopOverlays", x => x.Id);
                    table.ForeignKey(
                        name: "FK_SopOverlays_Clients_ClientId",
                        column: x => x.ClientId,
                        principalTable: "Clients",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SopOverlays_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_SopOverlays_ServiceItems_ServiceItemId",
                        column: x => x.ServiceItemId,
                        principalTable: "ServiceItems",
                        principalColumn: "Id");
                    table.ForeignKey(
                        name: "FK_SopOverlays_Sops_SopId",
                        column: x => x.SopId,
                        principalTable: "Sops",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Sops_ServiceItemId",
                table: "Sops",
                column: "ServiceItemId");

            migrationBuilder.CreateIndex(
                name: "IX_SopRuns_AgendaEventId",
                table: "SopRuns",
                column: "AgendaEventId");

            migrationBuilder.CreateIndex(
                name: "IX_SopRuns_ServiceItemId",
                table: "SopRuns",
                column: "ServiceItemId");

            migrationBuilder.CreateIndex(
                name: "IX_SopRuns_TodoItemId",
                table: "SopRuns",
                column: "TodoItemId");

            migrationBuilder.CreateIndex(
                name: "IX_SopOverlays_ClientId",
                table: "SopOverlays",
                column: "ClientId");

            migrationBuilder.CreateIndex(
                name: "IX_SopOverlays_OrganizationId",
                table: "SopOverlays",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_SopOverlays_ServiceItemId",
                table: "SopOverlays",
                column: "ServiceItemId");

            migrationBuilder.CreateIndex(
                name: "IX_SopOverlays_SopId",
                table: "SopOverlays",
                column: "SopId");

            migrationBuilder.AddForeignKey(
                name: "FK_SopRuns_AgendaEvents_AgendaEventId",
                table: "SopRuns",
                column: "AgendaEventId",
                principalTable: "AgendaEvents",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_SopRuns_ServiceItems_ServiceItemId",
                table: "SopRuns",
                column: "ServiceItemId",
                principalTable: "ServiceItems",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_SopRuns_TodoItems_TodoItemId",
                table: "SopRuns",
                column: "TodoItemId",
                principalTable: "TodoItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);

            migrationBuilder.AddForeignKey(
                name: "FK_Sops_ServiceItems_ServiceItemId",
                table: "Sops",
                column: "ServiceItemId",
                principalTable: "ServiceItems",
                principalColumn: "Id",
                onDelete: ReferentialAction.SetNull);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_SopRuns_AgendaEvents_AgendaEventId",
                table: "SopRuns");

            migrationBuilder.DropForeignKey(
                name: "FK_SopRuns_ServiceItems_ServiceItemId",
                table: "SopRuns");

            migrationBuilder.DropForeignKey(
                name: "FK_SopRuns_TodoItems_TodoItemId",
                table: "SopRuns");

            migrationBuilder.DropForeignKey(
                name: "FK_Sops_ServiceItems_ServiceItemId",
                table: "Sops");

            migrationBuilder.DropTable(
                name: "SopOverlays");

            migrationBuilder.DropIndex(
                name: "IX_Sops_ServiceItemId",
                table: "Sops");

            migrationBuilder.DropIndex(
                name: "IX_SopRuns_AgendaEventId",
                table: "SopRuns");

            migrationBuilder.DropIndex(
                name: "IX_SopRuns_ServiceItemId",
                table: "SopRuns");

            migrationBuilder.DropIndex(
                name: "IX_SopRuns_TodoItemId",
                table: "SopRuns");

            migrationBuilder.DropColumn(
                name: "ActionKind",
                table: "SopSteps");

            migrationBuilder.DropColumn(
                name: "ActionLabel",
                table: "SopSteps");

            migrationBuilder.DropColumn(
                name: "ActionPath",
                table: "SopSteps");

            migrationBuilder.DropColumn(
                name: "ApplicableArea",
                table: "Sops");

            migrationBuilder.DropColumn(
                name: "DefaultResponsible",
                table: "Sops");

            migrationBuilder.DropColumn(
                name: "IsTemplate",
                table: "Sops");

            migrationBuilder.DropColumn(
                name: "PackKey",
                table: "Sops");

            migrationBuilder.DropColumn(
                name: "ProcedureType",
                table: "Sops");

            migrationBuilder.DropColumn(
                name: "ServiceItemId",
                table: "Sops");

            migrationBuilder.DropColumn(
                name: "SituationAliases",
                table: "Sops");

            migrationBuilder.DropColumn(
                name: "SituationSearch",
                table: "Sops");

            migrationBuilder.DropColumn(
                name: "SlaBusinessDays",
                table: "Sops");

            migrationBuilder.DropColumn(
                name: "TriggerDescription",
                table: "Sops");

            migrationBuilder.DropColumn(
                name: "AgendaEventId",
                table: "SopRuns");

            migrationBuilder.DropColumn(
                name: "DelayNotes",
                table: "SopRuns");

            migrationBuilder.DropColumn(
                name: "ServiceItemId",
                table: "SopRuns");

            migrationBuilder.DropColumn(
                name: "TodoItemId",
                table: "SopRuns");

            migrationBuilder.DropColumn(
                name: "WasDelayed",
                table: "SopRuns");
        }
    }
}
